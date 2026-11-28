# Neodymium Zenith — team site

A static website: no accounts, no server code, no build step.

```
index.html      Home: hero + Lab notes feed
team.html       Students, coaches and mentors
design.html     Design principles, process, CAD and robot videos
outreach.html   Impact numbers and events
guides.html     Long-form build guides
site.css        Styles shared by every page
site.js         Shared script: renders pages from content.json + the editor
content.json    All text and settings
feed.xml        RSS feed of lab notes (rewritten every time you save)
images/         Photos and video clips
```

## Preview and edit

From this folder in Terminal (or GitHub Desktop → Repository → Open in Terminal):

```
python3 -m http.server 8000
```

- View: http://localhost:8000
- Edit: add `#edit` to any page, e.g. http://localhost:8000/#edit or http://localhost:8000/team.html#edit
- Click **Connect site folder** once and pick this folder (Chrome or Edge). Moving between pages in edit mode keeps the connection. After restarting the browser you may need to click **Reconnect folder**.

## Lab notes (the feed)

On the home page in edit mode, click **+ New note**. Each note can have:

- text (aim for 500 characters or less so it also fits social posts — the counter turns red above that)
- author, date and tags (comma separated — visitors can filter by tag)
- up to 4 photos or short video clips (clips play muted on a loop; tap for sound)
- a YouTube link, which plays inside the post
- an optional link, e.g. `guides.html#guide-build-a-soft-robot-gripper-in-one-weekend`

Every note has a **Link** (its own address) and a **Copy for social** button.

Set your public address once under **Edit hero text & photo → Site address** (e.g. `https://yourname.github.io/neodymium-zenith/`). It's used for shared links and the RSS feed.

Keep video clips under 25 MB (GitHub's website limit) — shorter and compressed is better. Put anything longer than ~15 seconds on YouTube and paste the link.

## Links in text

Write `[link text](https://example.com)` or paste a full `https://` address.

## Publish

In GitHub Desktop: write a summary → **Commit to main** → **Push origin**. GitHub Pages republishes in about a minute (check the green tick under **Actions**), then hard-refresh with Cmd+Shift+R.
