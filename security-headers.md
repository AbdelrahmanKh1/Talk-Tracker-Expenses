# Security Headers Configuration

The X-Frame-Options header has been removed from the HTML meta tags and should be configured on your server instead. Here's how to set it up on different platforms:

## 🚀 Deployment Platform Configuration

### Vercel (Recommended)
Create a `vercel.json` file in your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Netlify
Create a `netlify.toml` file in your project root:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

### AWS S3 + CloudFront
Configure CloudFront to add security headers:

```json
{
  "ResponseHeadersPolicyConfig": {
    "Name": "SecurityHeadersPolicy",
    "Comment": "Security headers for Talk Tracker",
    "SecurityHeadersConfig": {
      "XFrameOptions": {
        "Override": true,
        "FrameOption": "DENY"
      },
      "XContentTypeOptions": {
        "Override": true
      },
      "XSSProtection": {
        "Override": true,
        "Protection": true,
        "ModeBlock": true
      },
      "ReferrerPolicy": {
        "Override": true,
        "ReferrerPolicy": "strict-origin-when-cross-origin"
      },
      "StrictTransportSecurity": {
        "Override": true,
        "IncludeSubdomains": true,
        "Preload": true,
        "AccessControlMaxAgeSec": 31536000
      }
    }
  }
}
```

### Nginx
Add to your nginx configuration:

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Apache
Add to your `.htaccess` file:

```apache
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

## 🔒 Security Headers Explained

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enables XSS protection (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts sensitive API access |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS |

## 🧪 Testing Security Headers

After deployment, test your headers:

```bash
# Using curl
curl -I https://your-domain.com

# Using online tools
# https://securityheaders.com
# https://observatory.mozilla.org
```

## ✅ Verification

You should see these headers in the response:

```
HTTP/1.1 200 OK
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🚨 Important Notes

1. **X-Frame-Options**: Use `DENY` for maximum security, or `SAMEORIGIN` if you need same-origin iframe embedding
2. **HTTPS Required**: Strict-Transport-Security only works on HTTPS
3. **Browser Support**: Some headers are supported differently across browsers
4. **Testing**: Always test in production environment

## 🔧 Development Environment

For local development, you can use a simple Express server with helmet:

```javascript
const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

app.use(express.static('dist'));
app.listen(3000);
```

This configuration will ensure your application has proper security headers without the DevTools warning! 