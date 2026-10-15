/**
 * The «Retired Runner» frame (Sneaker Graveyard). A bike that carries a laid-to-rest sneaker's soul
 * wears it around its art, in the sneaker's quality colour, with the sneaker number engraved on
 * the plate.
 *
 * A COPY of packages/shared/src/utils/soul-frame.ts in the monorepo — the website does not depend
 * on @m2e/shared, so the spec travels as a file. Keep the two in step: same rects, same font,
 * same palettes, same three functions, or the frame on the website drifts from the one in the
 * app and in the NFT image the server renders.
 *
 * One definition, drawn three ways (react-native-svg, inline SVG here, sharp on the server), so it
 * is ONLY axis-aligned rectangles on a 128-cell grid over a square image, and the digits come
 * from a 3x5 pixel font here, never from a system font. The art stays visible inside imageWindow
 * (cells 8..119).
 */
export type SoulQuality = 'common' | 'uncommon' | 'rare' | 'epic';
export type FrameRole = 'outline' | 'band' | 'highlight' | 'shadow' | 'plate' | 'digit';
export type Rect = readonly [x: number, y: number, w: number, h: number];

export interface SoulFrameSpec {
  grid: number;
  band: number;
  imageWindow: { x: number; y: number; w: number; h: number };
  drawOrder: FrameRole[];
  rects: Record<Exclude<FrameRole, 'digit'>, Rect[]>;
  plate: { x: number; y: number; w: number; h: number; text: { x: number; y: number; w: number; h: number }; glyph: { w: number; h: number; gap: number } };
  font: Record<string, string[]>;
  palettes: Record<SoulQuality, Record<FrameRole, string>>;
}

export const RETIRED_RUNNER_FRAME: SoulFrameSpec = {"grid":128,"band":6,"imageWindow":{"x":8,"y":8,"w":112,"h":112},"drawOrder":["band","highlight","shadow","outline","plate","digit"],"rects":{"outline":[[2,0,124,1],[1,1,1,1],[126,1,1,1],[0,2,1,124],[127,2,1,124],[104,5,14,1],[7,7,114,1],[7,8,1,112],[120,8,1,112],[43,117,42,1],[42,118,1,2],[85,118,1,2],[7,120,36,1],[85,120,36,1],[42,121,1,4],[85,121,1,4],[43,125,42,1],[1,126,1,1],[126,126,1,1],[2,127,124,1]],"band":[[2,2,103,1],[109,2,17,1],[2,3,1,2],[5,3,5,2],[14,3,4,2],[22,3,4,2],[30,3,4,2],[38,3,4,2],[46,3,4,2],[54,3,4,2],[62,3,4,2],[70,3,4,2],[78,3,4,2],[86,3,4,2],[94,3,4,2],[102,3,3,2],[112,3,11,1],[125,3,1,2],[116,4,7,1],[2,5,102,1],[118,5,8,1],[2,6,4,4],[121,6,5,1],[122,7,4,3],[2,10,1,4],[5,10,1,4],[122,10,1,4],[125,10,1,4],[2,14,4,4],[122,14,4,4],[2,18,1,4],[5,18,1,4],[122,18,1,4],[125,18,1,4],[2,22,4,4],[122,22,4,4],[2,26,1,4],[5,26,1,4],[122,26,1,4],[125,26,1,4],[2,30,4,4],[122,30,4,4],[2,34,1,4],[5,34,1,4],[122,34,1,4],[125,34,1,4],[2,38,4,4],[122,38,4,4],[2,42,1,4],[5,42,1,4],[122,42,1,4],[125,42,1,4],[2,46,4,4],[122,46,4,4],[2,50,1,4],[5,50,1,4],[122,50,1,4],[125,50,1,4],[2,54,4,4],[122,54,4,4],[2,58,1,4],[5,58,1,4],[122,58,1,4],[125,58,1,4],[2,62,4,4],[122,62,4,4],[2,66,1,4],[5,66,1,4],[122,66,1,4],[125,66,1,4],[2,70,4,4],[122,70,4,4],[2,74,1,4],[5,74,1,4],[122,74,1,4],[125,74,1,4],[2,78,4,4],[122,78,4,4],[2,82,1,4],[5,82,1,4],[122,82,1,4],[125,82,1,4],[2,86,4,4],[122,86,4,4],[2,90,1,4],[5,90,1,4],[122,90,1,4],[125,90,1,4],[2,94,4,4],[122,94,4,4],[2,98,1,4],[5,98,1,4],[122,98,1,4],[125,98,1,4],[2,102,4,4],[122,102,4,4],[2,106,1,4],[5,106,1,4],[122,106,1,4],[125,106,1,4],[2,110,4,4],[122,110,4,4],[2,114,1,4],[5,114,1,4],[122,114,1,4],[125,114,1,4],[2,118,4,3],[122,118,4,4],[2,121,5,1],[2,122,40,1],[86,122,40,1],[2,123,1,2],[5,123,5,2],[14,123,4,2],[22,123,4,2],[30,123,4,2],[38,123,4,2],[86,123,4,2],[94,123,4,2],[102,123,4,2],[110,123,4,2],[118,123,5,2],[125,123,1,2],[2,125,41,1],[85,125,41,1]],"highlight":[[2,1,103,1],[108,1,18,1],[1,2,1,124],[121,7,1,114],[7,121,35,1],[86,121,36,1]],"shadow":[[105,1,3,1],[105,2,4,1],[126,2,1,124],[3,3,2,2],[10,3,4,2],[18,3,4,2],[26,3,4,2],[34,3,4,2],[42,3,4,2],[50,3,4,2],[58,3,4,2],[66,3,4,2],[74,3,4,2],[82,3,4,2],[90,3,4,2],[98,3,4,2],[105,3,7,1],[123,3,2,2],[105,4,11,1],[6,6,115,1],[6,7,1,114],[3,10,2,4],[123,10,2,4],[3,18,2,4],[123,18,2,4],[3,26,2,4],[123,26,2,4],[3,34,2,4],[123,34,2,4],[3,42,2,4],[123,42,2,4],[3,50,2,4],[123,50,2,4],[3,58,2,4],[123,58,2,4],[3,66,2,4],[123,66,2,4],[3,74,2,4],[123,74,2,4],[3,82,2,4],[123,82,2,4],[3,90,2,4],[123,90,2,4],[3,98,2,4],[123,98,2,4],[3,106,2,4],[123,106,2,4],[3,114,2,4],[123,114,2,4],[3,123,2,2],[10,123,4,2],[18,123,4,2],[26,123,4,2],[34,123,4,2],[90,123,4,2],[98,123,4,2],[106,123,4,2],[114,123,4,2],[123,123,2,2],[2,126,124,1]],"plate":[[43,118,42,7]]},"plate":{"x":42,"y":117,"w":44,"h":9,"text":{"x":43,"y":119,"w":42,"h":5},"glyph":{"w":3,"h":5,"gap":1},"align":"center"},"font":{"0":["###","#.#","#.#","#.#","###"],"1":[".#.","##.",".#.",".#.","###"],"2":["###","..#","###","#..","###"],"3":["###","..#","###","..#","###"],"4":["#.#","#.#","###","..#","..#"],"5":["###","#..","###","..#","###"],"6":["###","#..","###","#.#","###"],"7":["###","..#","..#","..#","..#"],"8":["###","#.#","###","#.#","###"],"9":["###","#.#","###","..#","###"],"#":["#.#","###","#.#","###","#.#"]},"palettes":{"common":{"outline":"#2C2420","plate":"#EFE8D8","digit":"#2C2420","band":"#837568","highlight":"#B5A796","shadow":"#5C5047"},"uncommon":{"outline":"#2C2420","plate":"#EFE8D8","digit":"#2C2420","band":"#5A7F45","highlight":"#93B57A","shadow":"#3B5A2C"},"rare":{"outline":"#2C2420","plate":"#EFE8D8","digit":"#2C2420","band":"#46689E","highlight":"#86A6D6","shadow":"#2E4770"},"epic":{"outline":"#2C2420","plate":"#EFE8D8","digit":"#2C2420","band":"#93488E","highlight":"#C98BC4","shadow":"#652F60"}}} as unknown as SoulFrameSpec;

/** STEPN's quality names → the four frame colours. Legendary wears the Epic frame. */
export function soulQuality(quality: string): SoulQuality {
  const q = quality.toLowerCase();
  return q === 'uncommon' || q === 'rare' || q === 'epic' ? q : q === 'legendary' ? 'epic' : 'common';
}

/**
 * What the plate says: "#" + the number while it fits (up to nine digits); a ten-digit number
 * drops the "#" to fit, and anything longer keeps its last ten digits. Ten glyphs is the plate.
 */
export function plateText(number: string): string {
  const digits = number.replace(/[^0-9]/g, '');
  return digits.length <= 9 ? '#' + digits : digits.slice(-10);
}

/** The plate text laid out as 1-cell-high runs. Unknown characters are skipped. */
export function plateDigitRects(number: string, spec: SoulFrameSpec = RETIRED_RUNNER_FRAME): Rect[] {
  const text = plateText(number);
  const { glyph: g, text: area } = spec.plate;
  const width = text.length * g.w + (text.length - 1) * g.gap;
  const x0 = area.x + Math.floor((area.w - width) / 2);
  const out: Rect[] = [];
  [...text].forEach((ch, i) => {
    const rows = spec.font[ch];
    if (!rows) return;
    rows.forEach((row, r) => {
      for (let c = 0; c < g.w; ) {
        if (row[c] !== '#') { c++; continue; }
        let w = 0;
        while (c + w < g.w && row[c + w] === '#') w++;
        out.push([x0 + i * (g.w + g.gap) + c, area.y + r, w, 1]);
        c += w;
      }
    });
  });
  return out;
}

/** The frame as coloured layers in draw order, in grid cells. */
export function soulFrameLayers(quality: string, number: string, spec: SoulFrameSpec = RETIRED_RUNNER_FRAME): { fill: string; rects: Rect[] }[] {
  const palette = spec.palettes[soulQuality(quality)];
  return spec.drawOrder.map((role) => ({
    fill: palette[role],
    rects: role === 'digit' ? plateDigitRects(number, spec) : spec.rects[role],
  }));
}
