# DNS Record Types Reference

Reference documentation for DNS record types used and supported on the LexBANK platform (Cloudflare DNS).

For the current zone configuration, see [`lexdo-uk-zone.txt`](./lexdo-uk-zone.txt).

---

## IP Address Resolution

At least one IP address resolution record is required for each domain on Cloudflare. These are the only record types that can be [proxied](https://developers.cloudflare.com/dns/proxy-status/) through Cloudflare.

### A and AAAA

A and AAAA records map a domain name to one or multiple IPv4 (A) or IPv6 (AAAA) addresses.

**Fields:**

| Field | Description |
|-------|-------------|
| **Name** | A subdomain or the zone apex (`@`). Labels must be 63 characters or less; the FQDN must not exceed 255 characters. Must start with a letter, end with a letter or digit, and contain only letters, digits, or hyphens. |
| **IPv4/IPv6 address** | Your origin server address. Cannot be a Cloudflare IP. |
| **TTL** | Time to live. Defaults to `Auto` (300s) when proxied; customisable when DNS-only. |
| **Proxy status** | Whether the record is proxied through Cloudflare or DNS-only. |

**Notes:**
- Cloudflare stores AAAA records in [canonical notation](https://www.rfc-editor.org/rfc/rfc5952.html#section-4.2) (e.g. `fe80::0:0:1` is stored as `fe80::1`).
- Alternative IPv4 notations (e.g. `1.1` for `1.0.0.1`) are not supported for A records.

**Example — current `lexdo.uk` A records:**

```
lexdo.uk.  3600  IN  A  185.199.108.153
lexdo.uk.  3600  IN  A  185.199.109.153
lexdo.uk.  3600  IN  A  185.199.110.153
lexdo.uk.  3600  IN  A  185.199.111.153
```

These point the apex domain to GitHub Pages.

**API example (creating an A record):**

```bash
curl "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  --request POST \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --json '{
    "type": "A",
    "name": "www.example.com",
    "content": "192.0.2.1",
    "ttl": 3600,
    "proxied": false
  }'
```

### CNAME

CNAME records map a domain name to another (canonical) domain name. They resolve to whatever record types are present on the target.

**Fields:**

| Field | Description |
|-------|-------------|
| **Name** | A subdomain or the zone apex (`@`). Same naming rules as A/AAAA. |
| **Target** | The hostname where traffic should be directed (e.g. `example.com`). |
| **TTL** | Time to live. Defaults to `Auto` (300s) when proxied; customisable when DNS-only. |
| **Proxy status** | Whether the record is proxied through Cloudflare or DNS-only. |

**Important considerations for proxied CNAME records:**
- CNAME chains are allowed (e.g. `www.example2.com` → `www.example1.com` → `www.example.com`), but the final record must resolve to a valid A or AAAA record.
- Cloudflare uses [CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/) for performance. This can interact with setups that depend on CNAME records.
- Some CNAME records (usually those associated with another CDN provider) cannot be proxied. Attempting to proxy them will cause connectivity errors.

**Example — current `lexdo.uk` CNAME record:**

```
www  3600  IN  CNAME  lexbank.github.io.
```

This points `www.lexdo.uk` to GitHub Pages.

**API example (creating a CNAME record):**

```bash
curl "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  --request POST \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --json '{
    "type": "CNAME",
    "name": "www.example.com",
    "content": "www.another-example.com",
    "ttl": 3600,
    "proxied": false
  }'
```

---

## Email Authentication

These records are recommended regardless of whether your domain sends email. Creating secure email records helps protect your domain against email spoofing. If your domain does not send email, consider adding [restrictive records](https://www.cloudflare.com/learning/dns/dns-records/protect-domains-without-email/).

### MX

A mail exchange (MX) record is required to deliver email to a mail server.

- [MX record syntax](https://www.cloudflare.com/learning/dns/dns-records/dns-mx-record/)
- [Create an MX record](https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/#send-and-receive-email)

### DKIM

A DomainKeys Identified Mail (DKIM) record ensures email authenticity by cryptographically signing emails.

- [DKIM record syntax](https://www.cloudflare.com/learning/dns/dns-records/dns-dkim-record/)
- [Create a DKIM record](https://developers.cloudflare.com/dmarc-management/security-records/#create-security-records)

### SPF

A Sender Policy Framework (SPF) record lists authorised IP addresses and domains that can send email on behalf of your domain.

- [SPF record syntax](https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/)
- [Create an SPF record](https://developers.cloudflare.com/dmarc-management/security-records/#create-security-records)

### DMARC

A Domain-based Message Authentication Reporting and Conformance (DMARC) record helps generate aggregate reports about email traffic and provides instructions for how receivers should treat non-conforming emails.

- [DMARC record syntax](https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/)
- [Create a DMARC record](https://developers.cloudflare.com/dmarc-management/security-records/#create-security-records)

---

## Specialised Records

### TXT

A text (TXT) record stores arbitrary text in DNS. Content consists of one or more strings delimited by double quotes (`"`).

**Common uses:**
- Demonstrating domain ownership for SSL/TLS certificate issuance
- Email authentication (SPF, DKIM, DMARC are stored as TXT records)
- Domain verification for third-party services

**Limits:**
- Each TXT record content must be 2,048 characters or less.
- The sum of content characters across all TXT records with the same name must be 8,192 or less.

### CAA

A Certificate Authority Authorization (CAA) record specifies which Certificate Authorities (CAs) are allowed to issue certificates for a domain.

- [CAA records documentation](https://developers.cloudflare.com/ssl/edge-certificates/caa-records/)

### SRV

A service record (SRV) specifies a host and port for specific services like VoIP, instant messaging, and more.

**API example (creating an SRV record):**

```bash
curl "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  --request POST \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --json '{
    "type": "SRV",
    "name": "_xmpp._tcp.example.com",
    "data": {
        "priority": 10,
        "weight": 5,
        "port": 5223,
        "target": "server.example.com"
    }
  }'
```

### SVCB and HTTPS

Service Binding (SVCB) and HTTPS Service (HTTPS) records provide clients with information about how to connect to a server upfront, without needing an initial plaintext HTTP connection.

If your domain has HTTP/2 or HTTP/3 enabled, proxied DNS records, and Universal SSL, Cloudflare automatically generates HTTPS records to advertise connection parameters.

- [Announcement blog post](https://blog.cloudflare.com/speeding-up-https-and-http-3-negotiation-with-dns/)
- [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460.html)

### PTR

A pointer (PTR) record specifies the allowed hosts for a given IP address. Used for reverse DNS lookups and should preferably be added to [reverse zones](https://developers.cloudflare.com/dns/additional-options/reverse-zones/).

### SOA

A start of authority (SOA) record stores information about your domain such as admin email address, when the domain was last updated, and more. If using Cloudflare authoritative DNS, this record is created automatically.

**SOA record fields:**

| Field | Description | Default | Min | Max |
|-------|-------------|---------|-----|-----|
| `MNAME` | Primary nameserver for the zone | — | — | — |
| `RNAME` | Admin email (`@` replaced by first `.`) | — | — | — |
| `Serial` | Serial number; secondary nameservers transfer if this increases | — | — | — |
| `Refresh` | Seconds before secondary queries primary for changes | `10000` | `600` | `86400` |
| `Retry` | Seconds before secondary retries after a failed query | `2400` | `600` | `3600` |
| `Expire` | Seconds before secondary stops answering if primary is unresponsive | `604800` | `86400` | `2419200` |
| `Record TTL` | TTL of the SOA record itself | `3600` | `1800` | `3600` |
| `Minimum TTL` | TTL for caching negative responses ([RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html#section-4)) | `1800` | `60` | `86400` |

### NS

A nameserver (NS) record indicates which server should be used for authoritative DNS. Only needed when using [subdomain setup](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/) or [delegating subdomains outside of Cloudflare](https://developers.cloudflare.com/dns/manage-dns-records/how-to/subdomains-outside-cloudflare/).

**Limits:**
- Maximum 10 NS records per delegation name (best practice: 7 or fewer per [RFC 1912](https://www.rfc-editor.org/rfc/rfc1912.html)).

### DS and DNSKEY

DS and DNSKEY records implement DNSSEC, which cryptographically signs DNS records to prevent domain spoofing. Most Cloudflare domains should follow the [DNSSEC setup guide](https://developers.cloudflare.com/dns/dnssec/) instead of adding these manually.

### Other Record Types

Cloudflare also supports less common record types: URI, NAPTR, SSHFP, TLSA, SMIMEA, and CERT.

---

## API Authentication

All Cloudflare DNS API calls require a Bearer token with at least the `DNS Write` permission.

```bash
--header "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Refer to the [Cloudflare API documentation](https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/create/) for full field definitions and the [permissions reference](https://developers.cloudflare.com/fundamentals/api/reference/permissions/).

---

## Further Reading

- [Cloudflare DNS record types reference](https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/)
- [Manage DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Proxied DNS records](https://developers.cloudflare.com/dns/proxy-status/)
- [CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/)
- [DNSSEC setup](https://developers.cloudflare.com/dns/dnssec/)
- [Protect domains that do not send email](https://www.cloudflare.com/learning/dns/dns-records/protect-domains-without-email/)
