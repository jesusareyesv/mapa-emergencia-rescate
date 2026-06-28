# dashboard/infra/k8s — Manifiestos Kubernetes del microfrontend

Manifiestos para desplegar el admin dashboard como **servicio independiente**
en el clúster Hetzner/k3s existente (namespace `mapa`).

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `deployment.yaml` | Deployment `dashboard`, selector `app: dashboard`, 2 réplicas, RollingUpdate zero-downtime, probes en `/api/health`. |
| `service.yaml` | Namespace `mapa` (idempotente) + Service `dashboard` tipo LoadBalancer. Plantilla con placeholders `${TLS_ANNOTATIONS}` / `${LB_PORTS}` para envsubst. |
| `dashboard-config.example.yaml` | ConfigMap `dashboard-config` de ejemplo con `EMERGENCY_API_URL`. Cópialo y aplícalo antes del primer deploy. |

## Segundo LB Hetzner

Este servicio provisiona un **segundo Load Balancer** Hetzner (`dashboard-lb`),
independiente del LB principal de la app raíz (`mapa-lb`). El cloud-controller-manager
de Hetzner crea el LB automáticamente al aplicar el Service de tipo LoadBalancer.

El subdominio previsto para este servicio es `admin.<dominio>` (por ejemplo
`admin.terremotovenezuela.app`). El registro DNS debe apuntar la A-record al IP
del `dashboard-lb`.

## TLS por entorno

El `service.yaml` es una plantilla: los placeholders `${TLS_ANNOTATIONS}` y
`${LB_PORTS}` se rellenan con `envsubst` en el workflow de deploy por entorno:

- **staging** → TLS en Cloudflare (proxied); el LB sirve HTTPS con cert de origen CF.
- **prod** → TLS en el LB; cert Let's Encrypt gestionado por Hetzner (DNS-01).

Patrón idéntico al de la app raíz: ver [`infra/k8s/service.yaml`](../../infra/k8s/service.yaml).

## Primer despliegue

1. Aplica el ConfigMap con los valores correctos para tu entorno:
   ```bash
   kubectl -n mapa apply -f dashboard/infra/k8s/dashboard-config.example.yaml
   ```
2. El workflow `deploy-dashboard.yml` (Task D3) aplica el resto automáticamente
   al mergear a `main` o mediante `workflow_dispatch`.

## Sin worker ni migraciones

El microfrontend dashboard **no tiene base de datos propia**. No hay worker
Deployment, migrate Job ni R2 upload en esta fase — los estáticos los sirve
el pod directamente desde el standalone de Next.js.
