# Güven Çekirdeği — Mimari Diyagram (Faz 1)

## Katmanlar ve güven sınırları

```mermaid
flowchart TB
  subgraph Istemci["İstemci (güvenilmez) — mobil uygulama, Faz 2+"]
    U["Kullanıcı A / B<br/>rol: authenticated"]
  end
  subgraph Backend["Backend (gelecek: Edge Functions)"]
    S["service_role<br/>(BYPASSRLS, ama tablo GRANT'i yok)"]
  end
  subgraph DB["PostgreSQL / Supabase"]
    direction TB
    API["api şeması — RPC<br/>send_invitation · respond_invitation · my_sent_invitations<br/>set_capability_consent · revoke_capability · my_capabilities<br/>send_message · block_user · end_match · report_user<br/>register_media_message* · can_send_media* (*yalnızca service_role)"]
    PUB["public şeması — RLS + yalnızca SELECT<br/>profiles · invitations · matches · conversations<br/>conversation_members · match_capabilities<br/>messages · message_media · blocks · capability_catalog"]
    TRG["Tetikleyiciler (her rolde çalışır)<br/>messages_enforce_rules<br/>message_media_enforce_rules<br/>match_capabilities_invariants"]
    PRIV["private şeması — hiçbir istemci rolü erişemez<br/>capability_consents (KÖR kararlar)<br/>capability_events (append-only)<br/>reports · audit_log · rate_limits · app_config<br/>age_verifications"]
  end
  U -- "EXECUTE (yalnızca api)" --> API
  U -- "SELECT (RLS süzgeçli)" --> PUB
  S -- "EXECUTE (medya kaydı)" --> API
  API -- "SECURITY DEFINER yazma" --> PUB
  API --> PRIV
  PUB -. "her INSERT/UPDATE" .-> TRG
  TRG -. "yetenek + üyelik + engel + çift onay kontrolü" .-> PRIV
  U -. "✗ INSERT/UPDATE/DELETE yok" .-x PUB
  S -. "✗ INSERT/UPDATE/DELETE yok" .-x PUB
  U -. "✗ şema kapalı" .-x PRIV
```

## Kör onay akışı (media_share örneği)

```mermaid
sequenceDiagram
  participant A as Kullanıcı A
  participant API as api.set_capability_consent
  participant C as private.capability_consents
  participant MC as public.match_capabilities
  participant B as Kullanıcı B
  A->>API: media_share = yes
  API->>C: A: yes (yalnızca A'nın satırı)
  API-->>A: "off" (henüz açılmadı)
  B->>API: media_share = not_now
  API->>C: B: not_now (yalnızca B'nin satırı)
  Note over MC: HİÇBİR değişiklik yok → A hiçbir şey öğrenemez
  API-->>B: "off"
  B->>API: media_share = yes
  API->>C: B: yes
  API->>MC: status = on, opened_at = now() (tetikleyici iki geçerli yes'i doğrular)
  API-->>B: "on"
  Note over A,B: İkisi de "Görsel paylaşımı artık açık" sistem mesajını görür
```

## ASCII özet

```
 Mobil (authenticated) ──EXECUTE──▶ api.*  ──SECURITY DEFINER──▶ public.* tabloları ──▶ TETİKLEYİCİLER
        │                              │                                   ▲                (her rolde)
        └──SELECT (RLS)────────────────┼───────────────────────────────────┘                    │
 Backend (service_role) ──EXECUTE──▶ api.register_media_message ─────────────────────────────────┤
        ✗ tablo yazma yetkisi yok                                                                 ▼
                                                     private.* (kararlar, olaylar, raporlar) ◀── kontrol
```
