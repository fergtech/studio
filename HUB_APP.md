# Hub App Integration — Society+

Society+ implements the **hub-app contract**, allowing it to be installed by any compatible hub platform as a provider of community initiative management.

When installed, the hub platform proxies initiative CRUD operations to Society+ and surfaces the content natively within its own UI — with Society+ attribution shown automatically via the `/api/hub-app/info` endpoint.

---

## Authentication

All hub-app endpoints are secured with a shared API key. The hub platform must include the following header on every request:

```
x-hub-api-key: <value of HUB_APP_KEY in .env>
```

Requests without a valid key receive `401 Unauthorized`.

---

## Endpoints

### App metadata
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/hub-app/info` | Returns app name, favicon URL, and supported capabilities |

### Initiatives
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/hub-app/initiatives` | List all initiatives with goals, members, and updates |
| `POST` | `/api/hub-app/initiatives` | Create an initiative (auto-creates user by email if needed) |
| `GET` | `/api/hub-app/initiatives/:id` | Get a single initiative with full detail |
| `PATCH` | `/api/hub-app/initiatives/:id` | Update title, description, status, or progress |
| `DELETE` | `/api/hub-app/initiatives/:id` | Delete an initiative |

### Goals (tasks)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/hub-app/initiatives/:id/goals` | List goals for an initiative as tasks |
| `POST` | `/api/hub-app/initiatives/:id/goals` | Add a goal to an initiative |
| `PATCH` | `/api/hub-app/goals/:id` | Update goal status (`todo → in-progress → done`) or other fields |
| `DELETE` | `/api/hub-app/goals/:id` | Delete a goal |

### Users
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/hub-app/users/ensure` | Find or create a Society+ user by email. Used to link hub platform users to Society+ accounts. |

---

## User Identity

Hub platform users are linked to Society+ accounts via a synthetic email address:

```
{username}@hub.citinet
```

The `/users/ensure` endpoint performs a find-or-create on this email. A random password is generated so the account is valid but not directly accessible via password login — it is intended to be managed entirely through the hub app integration.

---

## Status Mapping

Society+ and the hub-app contract use different status enumerations. The mapping is:

**Initiatives**
| Society+ (`InitiativeStatus`) | Hub contract |
|---|---|
| `Planning` | `planning` |
| `InProgress` | `active` |
| `Completed` | `completed` |

**Goals**
| Society+ (`GoalStatus`) | Hub contract |
|---|---|
| `NotStarted` | `todo` |
| `InProgress` | `in-progress` |
| `Completed` | `done` |

---

## Configuration

Add the following to your `.env`:

```env
# Shared secret — must match the key configured in the hub platform's admin panel
HUB_APP_KEY=your-secret-key-here
```

For local development the key can be any string. For production, use a long random secret and set the same value in the hub platform's app configuration.

---

## AI Guidance

Society+ auto-generates strategic guidance for each initiative using Google Gemini (primary) with Cloudflare Workers AI as a fallback. Guidance is generated:

- Automatically when an initiative is created through the Society+ UI
- On demand when a user opens the guidance panel for the first time

Guidance is stored in the `aiGuidance` field on the `Initiative` model and cached — subsequent views return the stored text without calling the AI again.

Required environment variables:
```env
GOOGLE_AI_API_KEY=...        # Primary — Gemini 2.0 Flash
CLOUDFLARE_ACCOUNT_ID=...    # Fallback
CLOUDFLARE_API_TOKEN=...     # Fallback
```
