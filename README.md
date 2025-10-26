# Studiogram

Studiogram is a web application for generating daily Instagram Story schedules. It allows users to choose between light and dark templates, customize the styling, and render a final 1080x1920 HTML page ready for screenshotting.

## How It Works

The application is a client-side React SPA. It uses `localStorage` to persist style configurations and `sessionStorage` for temporary schedule data provided during an active session.

### Endpoints

-   **`GET /`**: The homepage, which displays template previews and the style editor.
-   **`GET /#/render`**: Renders the active template at full 1080x1920 resolution. This is the URL that a screenshot service should target.
-   **`GET /#/ingest`**: The data ingestion endpoint. See details below.
-   **`GET /#/gym-finder`**: Onboarding page that helps you look up a Mindbody schedule and push it directly into the editor.

### Mindbody schedule function (`/api/schedule`)

The app ships with a Vercel serverless function that proxies Mindbody’s `classTime` search, reshapes the response into the app’s `Schedule` type, and returns it to the UI.  
This powers the Gym Finder page and can also be called directly.

#### Environment variables

Add the following values in Vercel (or a local `.env` consumed by `vercel dev`):

| Variable | Purpose |
| --- | --- |
| `MINDBODY_CLASS_SEARCH_URL` | Full URL of the Mindbody search endpoint you want to call. |
| `MINDBODY_API_KEY` | Optional API key header for the request. |
| `MINDBODY_SITE_ID` | Optional site identifier sent as `Site-Id`. |
| `MINDBODY_BEARER_TOKEN` | Optional Bearer token if the endpoint requires OAuth. |
| `MINDBODY_USE_SAMPLE` | Set to `true` to force the function to use `mindbody/response` as a local fixture (helpful for development). |

If `MINDBODY_CLASS_SEARCH_URL` is omitted or `MINDBODY_USE_SAMPLE=true`, the function automatically falls back to the sample payload in `mindbody/response`.

#### Local testing with the Vercel CLI

1. `npm install -g vercel` (once), then `vercel login`.
2. Inside this repo run `vercel link` to connect to an existing project or create a new one.
3. Use `vercel env pull .env.local` (optional) to sync env vars locally.
4. `vercel dev` starts both Vite and the serverless function at `http://localhost:3000/api/schedule`.

Deploy with `vercel` (preview) or `vercel deploy --prod` once you are ready.

## Data Ingestion via URL

To dynamically provide schedule and configuration data (e.g., from an automation service), use the `/#/ingest` route. This route processes URL parameters and then redirects to the final render page.

### Parameters

-   `schedule` (required): A base64-encoded JSON string of the schedule object.
-   `config` (optional): A base64-encoded JSON string of the configuration object. Overwrites existing styles if provided.
-   `scheduleUrl` (required if `schedule` is not used): A URL-encoded link to a JSON file containing the schedule.
-   `configUrl` (optional): A URL-encoded link to a JSON file containing the configuration.

**Note:** The direct `schedule` and `config` parameters take precedence over their `...Url` counterparts.

### Example: Using `schedule` parameter

Here's how to generate a valid ingestion URL from JavaScript:

```javascript
const schedule = {
  "date": "Tuesday, November 5",
  "items": [
    { "time": "10:00 AM", "class": "Advanced Sparring", "coach": "Master Ken" },
    { "time": "7:00 PM", "class": "Beginner's Kickboxing", "coach": "Ryu" }
  ]
};

// 1. Stringify the JSON object
const jsonString = JSON.stringify(schedule);

// 2. Base64-encode the string
const base64String = btoa(jsonString);

// 3. Create the URL (adjust domain as needed)
const ingestUrl = `/#/ingest?schedule=${base64String}`;

console.log(ingestUrl);
// You can now navigate to this URL to ingest the data and render the story.
```

### Example: Using `scheduleUrl` parameter

```javascript
const scheduleUrl = "https://api.example.com/schedules/today.json";
const encodedUrl = encodeURIComponent(scheduleUrl);
const ingestUrl = `/#/ingest?scheduleUrl=${encodedUrl}`;
```

## Usage with Browserless

1.  **Prepare the Ingest URL**: Use an automation tool (like n8n or a script) to construct the `/#/ingest` URL with the latest schedule data.
2.  **Navigate and Screenshot**: Instruct Browserless to navigate to the generated ingest URL. The app will automatically redirect to `/#/render`.
3.  **Set Viewport**: Ensure Browserless is configured with a 1080x1920 viewport to capture the story perfectly.
    ```json
    {
      "url": "YOUR_APP_URL/#/ingest?schedule=...",
      "options": {
        "viewport": {
          "width": 1080,
          "height": 1920
        }
      }
    }
    ```
4.  **Post to Instagram**: Use the captured screenshot in your social media automation workflow.
