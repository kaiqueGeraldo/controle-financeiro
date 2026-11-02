/** Runs in the target document. Canvas is detached; no attributes or wrappers are written. */
export function prepareTextPaint(element, clip) {
    const reference = { alpha: [], color: [], width: clip.width, height: clip.height };
    const canvas = document.createElement('canvas');
    canvas.width = clip.width;
    canvas.height = clip.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const ranges = [], walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    if (!('highlights' in CSS) || typeof Highlight === 'undefined')
        reference.error = 'highlight-api-unavailable';
    else if (CSS.highlights.size || !document.getSelection()?.isCollapsed)
        reference.error = 'existing-text-highlight';
    if (element instanceof HTMLElement && element.isContentEditable)
        reference.error = 'editable-text';
    for (const foreign of document.querySelectorAll('img,svg,canvas,video,iframe,object,embed')) {
        const r = foreign.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.right > clip.x && r.bottom > clip.y && r.x < clip.x + clip.width && r.y < clip.y + clip.height)
            reference.error = 'unsupported-paint-source';
    }
    for (let parent = element; parent; parent = parent.parentElement) {
        if (getComputedStyle(parent).backgroundImage.includes('url('))
            reference.error = 'unsupported-background-source';
    }
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent;
        if (!text?.trim())
            continue;
        const owner = node.parentElement, style = getComputedStyle(owner);
        if (style.writingMode !== 'horizontal-tb' || style.direction !== 'ltr' || style.textTransform !== 'none' || style.textShadow !== 'none' || style.textDecorationLine !== 'none' || parseFloat(style.getPropertyValue('-webkit-text-stroke-width')) !== 0 || style.fontFeatureSettings !== 'normal' || style.fontVariantCaps !== 'normal')
            reference.error = 'unsupported-text-rendering';
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = colorCanvas.height = 1;
        const colorCtx = colorCanvas.getContext('2d');
        colorCtx.fillStyle = style.getPropertyValue('-webkit-text-fill-color');
        colorCtx.fillRect(0, 0, 1, 1);
        const color = [...colorCtx.getImageData(0, 0, 1, 1).data];
        if (color[3] !== 255)
            reference.error = 'nonopaque-fill';
        if (reference.color.length && reference.color.some((c, i) => c !== color[i]))
            reference.error = 'mixed-fill';
        reference.color = color;
        ctx.font = style.fontStyle + ' ' + style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
        ctx.fontKerning = style.fontKerning;
        ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
        ctx.wordSpacing = style.wordSpacing === 'normal' ? '0px' : style.wordSpacing;
        ctx.fillStyle = 'white';
        const range = document.createRange();
        range.selectNodeContents(node);
        ranges.push(range.cloneRange());
        const lines = [];
        for (const { segment, index } of segmenter.segment(text)) {
            range.setStart(node, index);
            range.setEnd(node, index + segment.length);
            const boxes = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
            if (boxes.length > 1) {
                reference.error = 'ambiguous-grapheme-layout';
                continue;
            }
            if (!boxes.length)
                continue;
            const r = boxes[0], previous = lines.at(-1);
            if (previous && Math.abs(previous.box.y - r.y) < 0.01 && Math.abs(previous.box.height - r.height) < 0.01) {
                previous.end = index + segment.length;
                previous.box.width = r.right - previous.box.x;
            }
            else
                lines.push({ start: index, end: index + segment.length, box: { x: r.x, y: r.y, width: r.width, height: r.height } });
        }
        for (const line of lines) {
            const value = text.slice(line.start, line.end), metrics = ctx.measureText(value);
            if (Math.abs(metrics.width - line.box.width) > 1 || Math.abs(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent - line.box.height) > 1)
                reference.error = 'font-metrics-reference';
            ctx.fillText(value, line.box.x - clip.x, line.box.y - clip.y + metrics.fontBoundingBoxAscent);
        }
    }
    const pixels = ctx.getImageData(0, 0, clip.width, clip.height).data;
    reference.alpha = Array.from({ length: clip.width * clip.height }, (_, i) => pixels[4 * i + 3]);
    if (!reference.alpha.some(a => a >= 192))
        reference.error = 'no-reference-core';
    const name = 'rr3paint' + Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join('');
    let sheet, highlight;
    const ids = new Map();
    let nextId = 0;
    const properties = ['display', 'visibility', 'opacity', 'content-visibility', 'color', '-webkit-text-fill-color', '-webkit-text-stroke-width', 'text-shadow', 'text-decoration', 'font', 'font-feature-settings', 'font-variation-settings', 'letter-spacing', 'word-spacing', 'white-space', 'writing-mode', 'direction', 'text-transform', 'background', 'background-blend-mode', 'box-shadow', 'border', 'border-radius', 'outline', 'filter', 'backdrop-filter', 'mix-blend-mode', 'isolation', 'clip-path', 'mask-image', 'transform', 'overflow', 'z-index'];
    function state() {
        const items = [];
        for (const el of document.querySelectorAll('*')) {
            const r = el.getBoundingClientRect(), x = Math.max(clip.x, r.x), y = Math.max(clip.y, r.y), right = Math.min(clip.x + clip.width, r.right), bottom = Math.min(clip.y + clip.height, r.bottom);
            if (right <= x || bottom <= y)
                continue;
            if (!ids.has(el))
                ids.set(el, nextId++);
            const s = getComputedStyle(el), paint = properties.map(p => s.getPropertyValue(p));
            const pseudo = ['::before', '::after'].map(p => { const ps = getComputedStyle(el, p); return [ps.content, ...properties.map(k => ps.getPropertyValue(k))]; });
            items.push({ id: ids.get(el), box: [x, y, right - x, bottom - y], attrs: [...el.attributes].map(a => [a.name, a.value]), text: el.contains(element) ? null : [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join(''), paint, pseudo });
        }
        return JSON.stringify(items);
    }
    return {
        reference, state,
        mask() {
            if (reference.error)
                throw new Error(reference.error);
            sheet = new CSSStyleSheet();
            sheet.replaceSync('::highlight(' + name + '){color:transparent!important;-webkit-text-fill-color:transparent!important;background-color:transparent!important;text-shadow:none!important}');
            highlight = new Highlight(...ranges);
            highlight.priority = 2147483647;
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
            CSS.highlights.set(name, highlight);
            return getComputedStyle(element, '::highlight(' + name + ')').getPropertyValue('-webkit-text-fill-color') === 'rgba(0, 0, 0, 0)';
        },
        restore() {
            if (highlight && CSS.highlights.get(name) === highlight)
                CSS.highlights.delete(name);
            if (sheet)
                document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sheet);
        },
        restored() { return !CSS.highlights.has(name) && (!sheet || !document.adoptedStyleSheets.includes(sheet)); }
    };
}
/** Browser-side raster comparison; the reference is created before the intervention. */
export async function verifyTextPaint({ images, clip, glyphs, reference }) {
    const decode = async (bytes) => {
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
        try {
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            return { width: bitmap.width, height: bitmap.height, data: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data };
        }
        finally {
            bitmap.close();
        }
    };
    const [a, b, c] = await Promise.all(images.map(decode));
    if ([a, b, c].some(i => i.width !== clip.width || i.height !== clip.height))
        return { stable: false, dimensions: false, changedPixels: 0, glyphPixels: [], outsideMaskPixels: 0, wrongDirectionPixels: 0, unmatchedCorePixels: 0 };
    const width = a.width, height = a.height, contribution = new Uint8Array(width * height);
    let unstablePixels = 0, changedPixels = 0, outsideMaskPixels = 0, wrongDirectionPixels = 0, unmatchedCorePixels = 0;
    function near(x, y, predicate) {
        for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
                if (x + dx >= 0 && y + dy >= 0 && x + dx < width && y + dy < height && predicate((y + dy) * width + x + dx))
                    return true;
        return false;
    }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const p = y * width + x, i = 4 * p;
            if ([0, 1, 2, 3].some(k => a.data[i + k] !== c.data[i + k]))
                unstablePixels++;
            if (![0, 1, 2].some(k => a.data[i + k] !== b.data[i + k]))
                continue;
            changedPixels++;
            if (!near(x, y, n => reference.alpha[n] > 0))
                outsideMaskPixels++;
            const distance = (data) => [0, 1, 2].reduce((sum, k) => sum + (data[i + k] - reference.color[k]) ** 2, 0);
            if (distance(a.data) >= distance(b.data))
                wrongDirectionPixels++;
            else
                contribution[p] = 1;
        }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
            if (reference.alpha[y * width + x] >= 192 && !near(x, y, n => contribution[n] === 1))
                unmatchedCorePixels++;
    const glyphPixels = glyphs.map(g => g.rects.reduce((sum, r) => {
        let count = 0;
        for (let y = Math.max(0, Math.floor(r.y - clip.y)); y < Math.min(height, Math.ceil(r.y + r.height - clip.y)); y++)
            for (let x = Math.max(0, Math.floor(r.x - clip.x)); x < Math.min(width, Math.ceil(r.x + r.width - clip.x)); x++)
                count += contribution[y * width + x];
        return sum + count;
    }, 0));
    return { stable: unstablePixels === 0, dimensions: true, unstablePixels, changedPixels, glyphPixels, outsideMaskPixels, wrongDirectionPixels, unmatchedCorePixels };
}
