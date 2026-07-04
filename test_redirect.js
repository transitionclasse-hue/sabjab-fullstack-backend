const urls = [
  "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQERkVAe1svLCRZd9Fjxc4H94HB1a_n2S1br_sgCfobBF-W7d4RpUFJseW9ONbweSz75AXp73hqZ457dmcAEBDe2FYp5FoRyoQdr0t3nOGrTpyVtdqSWKT1vZvSfdULY7H0WM8KZlf_2X4wbqhPB81hwi_8wUSHt",
  "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGsSa6VUVBx9norDJoe3dm4uhiou2_sjc6CdXZpawrmiqgYA4aPGme2FWb6EN6fHL4uyy2Zjz2KjUzfJZiZTpdfvJo0Fn3NSL_hg0FaevWCmdCo9jU_"
];

async function follow() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      console.log(`URL: ${url} \n-> Redirected to: ${res.url}\n`);
    } catch (err) {
      console.error(`Error following ${url}:`, err.message);
    }
  }
}

follow();
