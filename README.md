# Studiogram

Studiogram is a web application for generating daily Instagram Story schedules. It allows users to choose between light and dark templates, customize the styling, and render a final 1080x1920 HTML page ready for screenshotting.

## Key Features

*   **Beautiful Templates:** Choose from a selection of pre-designed light and dark templates.
*   **Easy Customization:** A simple editor allows you to tweak colors, fonts, and styles to match your brand.
*   **Mindbody Integration:** Automatically fetch and display class schedules from any gym that uses Mindbody.
*   **Manual Entry:** Don't use Mindbody? No problem. You can manually input your schedule.
*   **Automation-Friendly:** Ingest schedule data via a URL for automated story generation.
*   **Perfectly Sized:** Renders a 1080x1920 story, ready for screenshotting and sharing.

## How It Works

Studiogram is a client-side React single-page application (SPA). It uses `localStorage` to persist your style configurations and `sessionStorage` for temporary schedule data.

The application also includes a Vercel serverless function that acts as a proxy for the Mindbody API, allowing you to fetch class schedules without exposing sensitive API keys on the client-side.

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/)
*   [Vercel CLI](https://vercel.com/docs/cli)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/instagram-story-schedule-generator.git
    cd instagram-story-schedule-generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the root of the project and add the following variables. These are used by the Vercel serverless function to connect to the Mindbody API.

    ```
    MINDBODY_CLASS_SEARCH_URL="YOUR_MINDBODY_API_ENDPOINT"
    MINDBODY_API_KEY="YOUR_MINDBODY_API_KEY"
    MINDBODY_SITE_ID="YOUR_MINDBODY_SITE_ID"
    MINDBODY_BEARER_TOKEN="YOUR_MINDBODY_BEARER_TOKEN"
    ```

    **Note:** If you don't have access to the Mindbody API, you can set `MINDBODY_USE_SAMPLE=true` to use mock data from `mindbody/response`.

4.  **Run the development server:**

    The best way to run the app locally is with the Vercel CLI, as it will run both the Vite dev server and the serverless function.

    ```bash
    vercel dev
    ```

    This will start the application at `http://localhost:3000`.

## Usage

There are a few ways to use Studiogram:

*   **Gym Finder:** The easiest way to get started. The app will guide you through finding your gym's Mindbody schedule and will automatically pull the data into the editor.
*   **Manual Entry:** If your gym doesn't use Mindbody, you can manually enter your schedule information.
*   **Data Ingestion via URL:** For automation, you can provide schedule and configuration data directly via URL parameters. This is perfect for integrating with other services or scripts.

### Data Ingestion Example

To dynamically provide a schedule, you can construct a URL like this:

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

// 3. Create the URL
const ingestUrl = `/#/ingest?schedule=${base64String}`;

// You can now navigate to this URL to ingest the data and render the story.
console.log(ingestUrl);
```

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

1.  **Link your project:**
    ```bash
    vercel link
    ```

2.  **Deploy to production:**
    ```bash
    vercel --prod
    ```

    Make sure to add your environment variables to the Vercel project settings.

## Advanced Usage: Automation with Browserless

You can use a service like [Browserless](https://www.browserless.io/) to automatically generate and screenshot your stories.

1.  **Prepare the Ingest URL**: Use an automation tool (like n8n or a script) to construct the `/#/ingest` URL with the latest schedule data.
2.  **Navigate and Screenshot**: Instruct Browserless to navigate to the generated ingest URL. The app will automatically redirect to the final render page.
3.  **Set Viewport**: Ensure Browserless is configured with a 1080x1920 viewport to capture the story perfectly.
4.  **Post to Instagram**: Use the captured screenshot in your social media automation workflow.