import { useEffect } from 'react';

/**
 * Watches the document for elements carrying the `reveal` class and adds
 * `is-revealed` once they enter the viewport. A MutationObserver picks up
 * elements added later (route changes, async data), so components only need
 * the CSS class - no per-component wiring.
 */
export function useRevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const observeAll = (root: ParentNode) => {
      root.querySelectorAll('.reveal:not(.is-revealed)').forEach((el) => io.observe(el));
    };

    observeAll(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('reveal')) io.observe(node);
            observeAll(node);
          }
        });
        // React reuses DOM nodes across renders, so an element can *become*
        // a .reveal via a className update with no node insertion.
        if (m.type === 'attributes' && m.target instanceof HTMLElement) {
          const el = m.target;
          if (el.classList.contains('reveal') && !el.classList.contains('is-revealed')) {
            io.observe(el);
          }
        }
      }
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
