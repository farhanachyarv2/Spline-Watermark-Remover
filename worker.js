export default {
  async fetch(request) {
    try {
      const urlObj = new URL(request.url);
      const base64Url = urlObj.searchParams.get("url");
      const path = urlObj.searchParams.get("path") || "";

      if (!base64Url) {
        return new Response(
          `Missing required parameter: "url"\n\n` +
          `Usage:\n` +
          `  https://spline.xydevs.com/?url=<base64-encoded-target-url>\n\n` +
          `Example:\n` +
          `  https://spline.xydevs.com/?url=${btoa("https://example.com")}`,
          { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
      

      const decodedUrl = atob(base64Url);
      const targetUrl = path ? new URL(path, decodedUrl).href : decodedUrl;

      const res = await fetch(targetUrl);
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        let body = await res.text();

        body = body.replace(
          /<\/head>/i,
          `<style>.spline-watermark{display:none !important;}</style></head>`
        );

        body = body.replace(/(src|href)="(?!https?:\/\/)([^"]+)"/g, (match, attr, src) => {
          return `${attr}="?url=${encodeURIComponent(base64Url)}&path=${encodeURIComponent(src)}"`;
        });

        return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      const buffer = await res.arrayBuffer();
      return new Response(buffer, { headers: { "Content-Type": contentType } });

    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};
