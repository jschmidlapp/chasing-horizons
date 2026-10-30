// Rehype plugin for Markdown bodies:
//  1. <img src="/media/..."> -> responsive img (srcset/sizes/width/height, lazy loading).
//  2. A paragraph containing only images -> <div class="gallery" data-count="N">, so themes can
//     lay out photo groups (from consecutive image lines in Markdown) as a grid.
//  3. In those galleries, an image with a Markdown title (`![alt](src "Caption")`) is wrapped in
//     <figure> with a <figcaption>, so a caption stays attached to its photo.
// Theme-agnostic: the theme only needs CSS for .gallery and an optional lightbox on [data-full].

import { visit } from 'unist-util-visit';
import { imageAttrs } from './media-core.mjs';

const isWhitespace = (n) => n.type === 'text' && !n.value.trim();

export default function rehypeMedia() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        // Matches the starter's widest photo row (--column in global.css, 1000px). Lone photos
        // with `width: auto` take this as their natural width, so it must agree with the gallery CSS.
        const attrs = imageAttrs(node.properties.src, { sizes: '(min-width: 1100px) 1000px, 100vw' });
        if (attrs.srcset) {
          node.properties = {
            ...node.properties,
            src: attrs.src,
            srcSet: attrs.srcset,
            sizes: attrs.sizes,
            width: attrs.width,
            height: attrs.height,
            dataFull: attrs['data-full'],
            loading: 'lazy',
            decoding: 'async',
          };
        }
      }
      if (node.tagName === 'p') {
        const kids = node.children.filter((c) => !isWhitespace(c) && !(c.type === 'element' && c.tagName === 'br'));
        if (kids.length && kids.every((c) => c.type === 'element' && c.tagName === 'img')) {
          node.tagName = 'div';
          node.properties = { className: ['gallery'], dataCount: kids.length };
          node.children = kids.map(figure);
        }
      }
    });
  };
}

function figure(img) {
  const caption = img.properties.title;
  if (!caption) return img;
  delete img.properties.title;
  return {
    type: 'element',
    tagName: 'figure',
    properties: {},
    children: [img, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: String(caption) }] }],
  };
}
