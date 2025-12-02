export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');
  
  try {
    const [redditAnime, redditGaming, redditMemes, airingAnime] = await Promise.all([
      fetchReddit('anime'),
      fetchReddit('gaming'),
      fetchReddit('animemes'),
      fetchMAL()
    ]);

    const briefs = [];
    
    // Brief from currently airing anime
    if (airingAnime.length > 0) {
      const top = airingAnime[0];
      briefs.push({
        type: 'anime',
        title: 'Trending Anime',
        concept: `${top.titleEnglish || top.title} - ${(top.members || 0).toLocaleString()} people watching`,
        searchYouTube: `${top.title} best scene`,
        hook: 'This anime broke me',
        editStyle: 'Emotional phonk + slow-mo on impact + dark color grade',
        caption: `${top.titleEnglish || top.title} hits different 😭🔥`,
        hashtags: '#anime #animeedit #viral #fyp #weeb'
      });
    }

    // Brief from Reddit anime
    const hotAnime = redditAnime.filter(p => p.score > 500 || /episode|scene|moment|clip|fight/i.test(p.title))[0];
    if (hotAnime) {
      briefs.push({
        type: 'anime',
        title: 'Reddit Buzz',
        concept: hotAnime.title,
        source: hotAnime.permalink,
        engagement: `${hotAnime.score.toLocaleString()} upvotes`,
        searchYouTube: hotAnime.title.split(' ').slice(0, 5).join(' ') + ' clip',
        hook: 'Wait for this scene',
        editStyle: 'Beat sync + zoom cuts + shake on impacts',
        caption: hotAnime.title.length > 100 ? hotAnime.title.slice(0, 100) + '...' : hotAnime.title,
        hashtags: '#anime #animemoments #viral #fyp'
      });
    }

    // Brief from Reddit gaming
    const hotGaming = redditGaming.filter(p => p.score > 1000 || /clip|moment|insane|best|clutch/i.test(p.title))[0];
    if (hotGaming) {
      briefs.push({
        type: 'gaming',
        title: 'Gaming Trend',
        concept: hotGaming.title,
        source: hotGaming.permalink,
        engagement: `${hotGaming.score.toLocaleString()} upvotes`,
        searchYouTube: hotGaming.title.split(' ').slice(0, 5).join(' ') + ' gameplay',
        hook: 'Wait for it...',
        editStyle: 'Tension build + bass drop + zoom on reaction',
        caption: (hotGaming.title.length > 80 ? hotGaming.title.slice(0, 80) + '...' : hotGaming.title) + ' 🎮',
        hashtags: '#gaming #gamer #viral #fyp #clutch'
      });
    }

    // Brief from memes
    if (redditMemes.length > 0) {
      briefs.push({
        type: 'meme',
        title: 'Meme Format',
        concept: 'Adapt this meme to anime content',
        reference: redditMemes[0].title,
        source: redditMemes[0].permalink,
        hook: 'POV:',
        editStyle: 'Match meme timing + add fitting anime reaction',
        caption: 'The accuracy 💀',
        hashtags: '#anime #animememes #viral #fyp'
      });
    }

    res.status(200).json({
      generated: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      briefs,
      raw: {
        airingAnime: airingAnime.slice(0, 5),
        redditAnime: redditAnime.slice(0, 5),
        redditGaming: redditGaming.slice(0, 5),
        memes: redditMemes.slice(0, 5)
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

async function fetchReddit(sub) {
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
      headers: { 'User-Agent': 'NethermindBot/1.0' }
    });
    if (!r.ok) return [];
    const d = await r.json();
    return d.data.children.map(p => ({
      title: p.data.title,
      score: p.data.score,
      comments: p.data.num_comments,
      permalink: `https://reddit.com${p.data.permalink}`,
      flair: p.data.link_flair_text
    }));
  } catch { return []; }
}

async function fetchMAL() {
  try {
    const r = await fetch('https://api.jikan.moe/v4/seasons/now?limit=10&sfw=true');
    if (!r.ok) return [];
    const d = await r.json();
    return d.data.map(a => ({
      title: a.title,
      titleEnglish: a.title_english,
      score: a.score,
      members: a.members,
      genres: a.genres?.map(g => g.name) || [],
      image: a.images?.jpg?.image_url
    }));
  } catch { return []; }
}
