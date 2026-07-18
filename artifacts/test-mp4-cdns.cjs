const urls = [
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://ia800300.us.archive.org/17/items/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
  "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4"
];

(async () => {
  for (const url of urls) {
    try {
      const f = await fetch(url, { method: 'HEAD' });
      console.log(`${f.status} (${f.headers.get('content-type')}) -> ${url}`);
    } catch (e) {
      console.log(`ERR -> ${url}: ${e.message}`);
    }
  }
})();
