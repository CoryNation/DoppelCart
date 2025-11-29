function T(el){ return (el?.textContent || '').replace(/\s+/g,' ').trim(); }
function abs(href){ try{ return new URL(href, location.href).toString(); }catch(_){ return ''; } }
function timeFrom(el){
  const t = el?.querySelector('time');
  return (t && (t.getAttribute('datetime') || t.getAttribute('title') || t.getAttribute('aria-label'))) || '';
}

function parsePosts(){
  const items = Array.from(document.querySelectorAll([
    '[data-urn^="urn:li:activity:"]',
    '[data-entity-urn^="urn:li:activity:"]',
    'article[data-urn]',
    'li[data-urn]',
    'div[data-urn]'
  ].join(',')));

  const rows = [];
  for(const node of items){
    const urn = node.getAttribute('data-urn') ||
                node.getAttribute('data-entity-urn') ||
                '';

    const link = node.querySelector('a[href*="/feed/update/"], a[href*="/posts/"], a[href*="urn:li:activity:"]');
    const postUrl = abs(link?.getAttribute('href') || '');

    const textNode =
      node.querySelector('[data-test-reusable-feed-message]') ||
      node.querySelector('.update-components-text') ||
      node.querySelector('div[dir="ltr"]') ||
      node.querySelector('span.break-words') ||
      node.querySelector('[data-content-loaded="true"]') ||
      node;
    const text = T(textNode);

    const authorLink =
      node.querySelector('a[href*="/in/"][data-view-name]') ||
      node.querySelector('a.app-aware-link[href*="/in/"]') ||
      node.querySelector('a[href*="/company/"]') ||
      node.querySelector('a[href*="/school/"]');
    const authorName = T(authorLink);
    const authorUrl = abs(authorLink?.getAttribute('href') || '');

    const createdIso = timeFrom(node) || '';

    const likeEl = node.querySelector('[data-test-like-count], [aria-label*="like" i]');
    const cmtEl  = node.querySelector('[data-test-comment-count], [aria-label*="comment" i]');
    const rpEl   = node.querySelector('[data-test-repost-count], [aria-label*="repost" i]');
    const likeCount = (T(likeEl).match(/\d[\d,]*/)?.[0]) || '';
    const commentCount = (T(cmtEl).match(/\d[\d,]*/)?.[0]) || '';
    const repostCount = (T(rpEl).match(/\d[\d,]*/)?.[0]) || '';

    if (!urn && !postUrl && !text) continue;

    rows.push([urn, postUrl, createdIso, text, authorName, authorUrl, likeCount, commentCount, repostCount]);
  }
  return rows;
}

function parseComments(){
  const nodes = Array.from(document.querySelectorAll([
    '[data-urn^="urn:li:comment:"]',
    '[data-id^="urn:li:comment:"]',
    '[data-test-comment-urn]',
    'article.comment',
    'li.comments-comment-item'
  ].join(',')));

  const rows = [];
  for(const c of nodes){
    const urn = c.getAttribute('data-urn') || c.getAttribute('data-id') || c.getAttribute('data-test-comment-urn') || '';

    const textEl = c.querySelector('[data-test-comment-message], div[dir="ltr"], p, span.break-words, .comments-comment-item__main-content');
    const text = T(textEl);

    const parent = c.closest('[data-test-feed-item-container], article[data-urn], [data-entity-urn]');
    const postUrn = parent?.getAttribute('data-urn') || parent?.getAttribute('data-entity-urn') || '';
    const postLink = parent?.querySelector('a[href*="/feed/update/"], a[href*="/posts/"], a[href*="urn:li:activity:"]');
    const postUrl = abs(postLink?.getAttribute('href') || '');

    const authorA = c.querySelector('a[href*="/in/"]');
    const authorName = T(authorA);
    const authorUrl = abs(authorA?.getAttribute('href') || '');

    const createdIso = timeFrom(c) || '';

    const like = c.querySelector('[aria-label*="like" i], [data-test-like-count]');
    const likeCount = (T(like).match(/\d[\d,]*/)?.[0]) || '';

    const commentUrl = urn ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn || '')}/?commentUrn=${encodeURIComponent(urn)}` : '';

    if (!urn && !text) continue;

    rows.push([urn, commentUrl, postUrn, postUrl, createdIso, text, authorName, authorUrl, likeCount]);
  }
  return rows;
}

