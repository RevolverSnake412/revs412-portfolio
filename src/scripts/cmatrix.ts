export type CMatrixResult = { kind: 'help' | 'version' | 'run' | 'error'; text?: string; options?: CMatrixOptions };

export type CMatrixOptions = {
  asynchronous: boolean;
  bold: 0 | 1 | 2;
  linux: boolean;
  oldStyle: boolean;
  screensaver: boolean;
  xWindow: boolean;
  update: number;
  color: string;
  rainbow: boolean;
  lambda: boolean;
  japanese: boolean;
  lock: boolean;
  message: string;
  changing: boolean;
  tty: string;
};

const colors: Record<string, string> = {
  green: '#22c55e', red: '#ef4444', blue: '#3b82f6', white: '#f8fafc', yellow: '#eab308', cyan: '#22d3ee', magenta: '#e879f9', black: '#000000',
};
const defaultOptions = (): CMatrixOptions => ({ asynchronous: false, bold: 0, linux: false, oldStyle: false, screensaver: false, xWindow: false, update: 4, color: 'green', rainbow: false, lambda: false, japanese: false, lock: false, message: '', changing: false, tty: '' });

const usage = `Usage: cmatrix -[abBcfhlsmVxk] [-u delay] [-C color] [-t tty] [-M message]\n -a  asynchronous scroll\n -b  bold characters\n -B  all bold characters\n -c  Japanese characters\n -f  force Linux terminal profile\n -l  Linux matrix glyph profile\n -L  lock mode\n -o  old-style scrolling\n -h  print this help and exit\n -n  no bold characters\n -s  screensaver mode (exit on keypress)\n -x  X window key mode\n -V  print version and exit\n -M  centre a message\n -u  update delay (0–10)\n -C  color: green red blue white yellow cyan magenta black\n -r  rainbow mode\n -m  lambda mode\n -k  change characters while scrolling\n -t  simulated target terminal\n\nDuring playback: q quit · a async · b/B/n bold · 0–9 speed · !/@/#/$/%/^/& color · r rainbow · m lambda · p pause`;

export const parseCMatrix = (args: string[]): CMatrixResult => {
  const options = defaultOptions();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('-') || arg === '-') return { kind: 'error', text: `cmatrix: invalid argument: ${arg}` };
    if (arg === '--help') return { kind: 'help', text: usage };
    if (arg === '--version') return { kind: 'version', text: 'CMatrix browser port — compatible command interface' };
    for (let position = 1; position < arg.length; position += 1) {
      const flag = arg[position];
      const takesValue = flag === 'u' || flag === 'C' || flag === 'M' || flag === 't';
      let value = '';
      if (takesValue) {
        value = arg.slice(position + 1) || args[++index] || '';
        position = arg.length;
        if (!value) return { kind: 'error', text: `cmatrix: option -${flag} requires an argument` };
      }
      if (flag === 'a') options.asynchronous = true;
      else if (flag === 'b' && options.bold !== 2) options.bold = 1;
      else if (flag === 'B') options.bold = 2;
      else if (flag === 'c') options.japanese = true;
      else if (flag === 'f' || flag === 'l') options.linux = true;
      else if (flag === 'L') options.lock = true;
      else if (flag === 'o') options.oldStyle = true;
      else if (flag === 'n') options.bold = 0;
      else if (flag === 's') options.screensaver = true;
      else if (flag === 'x') options.xWindow = true;
      else if (flag === 'r') options.rainbow = true;
      else if (flag === 'm') options.lambda = true;
      else if (flag === 'k') options.changing = true;
      else if (flag === 'h') return { kind: 'help', text: usage };
      else if (flag === 'V') return { kind: 'version', text: 'CMatrix browser port — compatible command interface' };
      else if (flag === 'u') {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10) return { kind: 'error', text: 'cmatrix: update delay must be between 0 and 10' };
        options.update = parsed;
      } else if (flag === 'C') {
        const color = value.toLowerCase();
        if (!(color in colors)) return { kind: 'error', text: `cmatrix: unknown color: ${value}` };
        options.color = color;
      } else if (flag === 'M') options.message = value;
      else if (flag === 't') options.tty = value;
      else return { kind: 'error', text: `cmatrix: invalid option -- '${flag}'` };
    }
  }
  return { kind: 'run', options };
};

type Stream = { y: number; speed: number; length: number; chars: string[]; hue: number };

export class CMatrix {
  private context: CanvasRenderingContext2D;
  private streams: Stream[] = [];
  private frame = 0;
  private raf = 0;
  private last = 0;
  private paused = false;
  private active = false;
  private width = 0;
  private height = 0;
  private columns = 0;
  private rows = 0;
  private fontSize = 14;
  private charWidth = 8;
  private observer: ResizeObserver;
  private readonly alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>?/\\|';
  private readonly japanese = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ';
  private readonly linuxGlyphs = '│╎╏┆┇╵╷╽╿░▒▓';
  constructor(private canvas: HTMLCanvasElement, private options: CMatrixOptions, private onExit: () => void) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    this.context = context;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }
  start() { this.active = true; this.paused = false; this.resize(); this.last = performance.now(); this.tick(this.last); }
  stop() { this.active = false; cancelAnimationFrame(this.raf); this.context.clearRect(0, 0, this.width, this.height); }
  isActive() { return this.active; }
  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(rect.width)); this.height = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * ratio); this.canvas.height = Math.floor(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.fontSize = Math.max(10, Math.min(18, Math.floor(this.width / 52)));
    this.charWidth = Math.ceil(this.fontSize * .62);
    this.columns = Math.max(1, Math.floor(this.width / this.charWidth)); this.rows = Math.max(1, Math.floor(this.height / (this.fontSize * 1.05)));
    this.streams = Array.from({ length: this.columns }, (_, column) => this.makeStream(column, true));
  }
  private makeStream(column: number, initial = false): Stream {
    const length = 4 + Math.floor(Math.random() * Math.max(5, this.rows * .55));
    return { y: initial ? -Math.random() * this.rows : -length, speed: this.options.asynchronous ? .25 + Math.random() * .65 : .5, length, chars: Array.from({ length }, () => this.character()), hue: (column * 17 + Math.random() * 80) % 360 };
  }
  private character() { const source = this.options.japanese ? this.japanese : this.options.linux ? this.linuxGlyphs : this.alphabet; return this.options.lambda ? 'λ' : source[Math.floor(Math.random() * source.length)]; }
  private tick = (now: number) => {
    if (!this.active) return;
    const delay = Math.max(8, this.options.update * 10);
    if (now - this.last >= delay) { this.last = now; if (!this.paused) this.draw(); }
    this.raf = requestAnimationFrame(this.tick);
  };
  private draw() {
    this.context.fillStyle = '#010306'; this.context.fillRect(0, 0, this.width, this.height);
    this.context.font = `${this.options.bold === 2 ? 700 : 400} ${this.fontSize}px "SFMono-Regular", Consolas, monospace`;
    this.context.textBaseline = 'top';
    this.streams.forEach((stream, column) => {
      if (this.options.asynchronous || this.frame % 2 === 0) stream.y += stream.speed;
      if (stream.y - stream.length > this.rows) this.streams[column] = this.makeStream(column);
      const active = this.streams[column];
      if (this.options.oldStyle) {
        active.chars.unshift(this.character());
        active.chars.length = active.length;
      }
      if (this.options.changing && Math.random() < .18) active.chars[Math.floor(Math.random() * active.chars.length)] = this.character();
      for (let offset = 0; offset < active.length; offset += 1) {
        const row = Math.floor(active.y - offset); if (row < 0 || row >= this.rows) continue;
        const head = offset === 0;
        const color = this.options.rainbow ? `hsl(${(active.hue + offset * 11 + this.frame * 3) % 360} 86% ${head ? 78 : 58}%)` : head ? '#f8fafc' : colors[this.options.color];
        this.context.fillStyle = color;
        this.context.globalAlpha = head ? 1 : Math.max(.14, 1 - offset / (active.length + 2));
        this.context.font = `${this.options.bold === 2 || (this.options.bold === 1 && offset % 2 === 0) ? 700 : 400} ${this.fontSize}px "SFMono-Regular", Consolas, monospace`;
        const glyph = this.options.lambda ? 'λ' : active.chars[offset];
        this.context.fillText(glyph, column * this.charWidth, row * this.fontSize * 1.05);
      }
    });
    this.context.globalAlpha = 1;
    if (this.options.message) {
      this.context.font = `700 ${this.fontSize}px "SFMono-Regular", Consolas, monospace`;
      const width = this.context.measureText(this.options.message).width;
      this.context.fillStyle = '#010306'; this.context.fillRect((this.width - width) / 2 - 14, this.height / 2 - this.fontSize, width + 28, this.fontSize * 2.5);
      this.context.fillStyle = '#f8fafc'; this.context.fillText(this.options.message, (this.width - width) / 2, this.height / 2 - this.fontSize * .1);
    }
    this.frame += 1;
  }
  key(event: KeyboardEvent) {
    const key = event.key;
    if (this.options.screensaver || this.options.xWindow) return this.exit();
    if ((key === 'q' || (event.ctrlKey && key.toLowerCase() === 'c')) && !this.options.lock) return this.exit();
    if (key === 'a') this.options.asynchronous = !this.options.asynchronous;
    else if (key === 'b') this.options.bold = 1;
    else if (key === 'B') this.options.bold = 2;
    else if (key === 'n') this.options.bold = 0;
    else if (/^[0-9]$/.test(key)) this.options.update = Number(key);
    else if (key === '!') { this.options.color = 'red'; this.options.rainbow = false; }
    else if (key === '@') { this.options.color = 'green'; this.options.rainbow = false; }
    else if (key === '#') { this.options.color = 'yellow'; this.options.rainbow = false; }
    else if (key === '$') { this.options.color = 'blue'; this.options.rainbow = false; }
    else if (key === '%') { this.options.color = 'magenta'; this.options.rainbow = false; }
    else if (key === '^') { this.options.color = 'cyan'; this.options.rainbow = false; }
    else if (key === '&') { this.options.color = 'white'; this.options.rainbow = false; }
    else if (key === 'r') this.options.rainbow = true;
    else if (key === 'm') this.options.lambda = !this.options.lambda;
    else if (key === 'p' || key === 'P') this.paused = !this.paused;
  }
  private exit() { this.stop(); this.onExit(); }
}
