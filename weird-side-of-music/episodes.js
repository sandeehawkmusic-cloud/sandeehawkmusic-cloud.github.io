/* The Weird Side of Music: renders released episodes from /weird-side-of-music/episodes.json.
   Any element with [data-episodes] gets its cards replaced by the released episodes (newest first).
   Optional data-limit="N" shows only the newest N. If the JSON can't load, the static cards stay.
   Episodes whose releaseAt is in the future stay hidden until that moment. */
(function(){
  var CHANNEL='https://youtube.com/@sandeehawkmusic/shorts';
  var lists=document.querySelectorAll('[data-episodes]');

  function smart(s){
    return String(s).replace(/(^|[\s(\[])"/g,'$1\u201C').replace(/"/g,'\u201D').replace(/'/g,'\u2019');
  }
  function ytId(url){
    var m=url&&String(url).match(/(?:shorts\/|embed\/|youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/);
    return m?m[1]:null;
  }
  function el(tag,cls,text){
    var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;
  }
  function link(href,text){
    var a=el('a',null,text);a.href=href;a.target='_blank';a.rel='noopener';return a;
  }
  function card(ep){
    var title=smart(ep.title),id=ytId(ep.youtubeUrl);
    var art=el('article','ep');art.setAttribute('data-ep',ep.number);
    var media=link(id?ep.youtubeUrl:CHANNEL,null);media.className='ep-media';
    if(id){media.setAttribute('data-yt',id);media.setAttribute('aria-label','Play '+title+' on YouTube');}
    else media.setAttribute('aria-label','Watch '+title+' on the SandeeHawk Music YouTube channel');
    if(ep.thumbnail){
      var img=el('img');img.src=ep.thumbnail;img.width=360;img.height=640;img.loading='lazy';
      img.alt=ep.thumbnailAlt||('Thumbnail for '+title);media.appendChild(img);
    }
    var play=el('span','play');play.setAttribute('aria-hidden','true');media.appendChild(play);
    art.appendChild(media);
    var body=el('div','ep-body');
    var num=el('p','ep-num','Episode '+ep.number+' \u00B7 ');num.appendChild(el('span','era',ep.era||''));
    body.appendChild(num);
    body.appendChild(el('h3',null,title));
    body.appendChild(el('p',null,smart(ep.summary||'')));
    var links=el('p','links');
    links.appendChild(id?link(ep.youtubeUrl,'YouTube Short'):link(CHANNEL,'YouTube channel'));
    if(ep.facebookUrl)links.appendChild(link(ep.facebookUrl,'Facebook Reel'));
    body.appendChild(links);art.appendChild(body);
    return art;
  }

  var timer=null;
  function render(all){
    var now=Date.now();
    var released=all.filter(function(e){var t=Date.parse(e.releaseAt);return !isNaN(t)&&t<=now;})
      .sort(function(a,b){return Date.parse(b.releaseAt)-Date.parse(a.releaseAt)||b.number-a.number;});
    if(!released.length)return;
    lists.forEach(function(list){
      var lim=parseInt(list.getAttribute('data-limit'),10);
      var show=lim>0?released.slice(0,lim):released;
      list.textContent='';
      show.forEach(function(ep){list.appendChild(card(ep));});
    });
    // Show the next episode the moment it is released, if that's within the next 12 hours.
    var next=all.map(function(e){return Date.parse(e.releaseAt);}).filter(function(t){return t>now;}).sort(function(a,b){return a-b;})[0];
    if(timer)clearTimeout(timer);
    if(next&&next-now<12*3600e3)timer=setTimeout(function(){render(all);},next-now+1000);
  }

  // Click a thumbnail to play the Short in place (works for static and rendered cards).
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a.ep-media[data-yt]');
    if(!a||e.ctrlKey||e.metaKey||e.shiftKey)return;
    e.preventDefault();
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+a.getAttribute('data-yt')+'?autoplay=1&rel=0';
    f.title=(a.getAttribute('aria-label')||'').replace(/^Play /,'').replace(/ on YouTube$/,'');
    f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy='strict-origin-when-cross-origin';f.allowFullscreen=true;
    var box=document.createElement('div');box.className='ep-media';box.appendChild(f);
    a.closest('.ep').classList.add('playing');a.replaceWith(box);
  });

  if(!lists.length||!window.fetch)return;
  fetch('/weird-side-of-music/episodes.json',{cache:'no-cache'})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(data){if(Array.isArray(data))render(data);})
    .catch(function(){/* keep the static cards */});
})();
