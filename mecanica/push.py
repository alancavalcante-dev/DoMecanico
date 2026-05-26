import json


def enviar_push_oficina(oficina, titulo, corpo, url='/'):
    try:
        from pywebpush import webpush, WebPushException
        from decouple import config as env
        from accounts.models import PushSubscription, MembroOficina

        from adminpanel.models import ConfiguracaoSistema
        if not ConfiguracaoSistema.get().push_notifications_ativas:
            return

        vapid_key = env('VAPID_PRIVATE_KEY', default='')
        if not vapid_key:
            return

        membros_ids = MembroOficina.objects.filter(
            oficina=oficina, papel='admin'
        ).values_list('id', flat=True)
        subs = PushSubscription.objects.filter(membro_id__in=membros_ids)

        payload = json.dumps({'title': titulo, 'body': corpo, 'url': url})
        stale = []
        for sub in subs:
            try:
                webpush(
                    subscription_info={
                        'endpoint': sub.endpoint,
                        'keys': {'auth': sub.auth, 'p256dh': sub.p256dh},
                    },
                    data=payload,
                    vapid_private_key=vapid_key,
                    vapid_claims={'sub': 'mailto:contato@domecanico.net'},
                )
            except WebPushException as e:
                if e.response and e.response.status_code in (404, 410):
                    stale.append(sub.id)
        if stale:
            PushSubscription.objects.filter(id__in=stale).delete()
    except Exception:
        pass
