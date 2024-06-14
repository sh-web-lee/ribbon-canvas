interface RibbonsPoint {
  x: number;
  y: number;
}

class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.set(x, y);
  }

  set(x: number, y: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  copy(point: RibbonsPoint) {
    this.x = point.x || 0;
    this.y = point.y || 0;
    return this;
  }

  multiply(x: number, y: number) {
    this.x *= x || 1;
    this.y *= y || 1;
    return this;
  }

  divide(x: number, y: number) {
    this.x /= x || 1;
    this.y /= y || 1;
    return this;
  }

  add(x: number, y: number) {
    this.x += x || 0;
    this.y += y || 0;
    return this;
  }

  subtract(x: number, y: number) {
    this.x -= x || 0;
    this.y -= y || 0;
    return this;
  }

  clampX(min: number, max: number) {
    this.x = Math.max(min, Math.min(this.x, max));
    return this;
  }

  clampY(min: number, max: number) {
    this.y = Math.max(min, Math.min(this.y, max));
    return this;
  }

  flipX() {
    this.x *= -1;
    return this;
  }

  flipY() {
    this.y *= -1;
    return this;
  }
}

interface RibbonSection {
  point1: Point;
  point2: Point;
  point3: Point;
  color: number;
  delay: number;
  dir: string;
  alpha: number;
  phase: number;
}

interface RibbonsOptions {
  colorSaturation: string;
  colorBrightness: string;
  colorAlpha: number;
  colorCycleSpeed: number;
  verticalPosition:
    | 'min'
    | 'max'
    | 'top'
    | 'bottom'
    | 'middle'
    | 'center'
    | 'random';
  horizontalSpeed: number;
  ribbonCount: number;
  strokeSize: number;
  parallaxAmount: number;
  animateSections: boolean;
}

class Ribbons {
  /**  */
  _canvas: HTMLCanvasElement;
  _context: CanvasRenderingContext2D;
  _options: RibbonsOptions;
  _width: number;
  _height: number;
  _scroll: number;
  _ribbons: RibbonSection[][];
  /** 设备辅助函数 */
  _suptool: SupTool;
  constructor(options: RibbonsOptions) {
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d')!;
    this._width = 0;
    this._height = 0;
    this._scroll = 0;
    this._ribbons = [];
    this._suptool = new SupTool();
    this._options = {
      colorSaturation: '80%',
      colorBrightness: '60%',
      colorAlpha: 0.65,
      colorCycleSpeed: 6,
      verticalPosition: 'center',
      horizontalSpeed: 150,
      ribbonCount: 5,
      strokeSize: 5,
      parallaxAmount: -0.5,
      animateSections: true,
    };
    this.onDraw = this.onDraw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onScroll = this.onScroll.bind(this);

    this.setOptions(options);
    this.init();
  }

  init() {
    try {
      this._canvas.style.display = 'block';
      this._canvas.style.position = 'fixed';
      this._canvas.style.margin = '0';
      this._canvas.style.padding = '0';
      this._canvas.style.border = '0';
      this._canvas.style.outline = '0';
      this._canvas.style.left = '0';
      this._canvas.style.top = '0';
      this._canvas.style.width = '100%';
      this._canvas.style.height = '100%';
      this._canvas.style.zIndex = '99999';
      this.onResize();
      this._context.clearRect(0, 0, this._width, this._height);
      window.addEventListener('resize', this.onResize);
      window.addEventListener('scroll', this.onScroll);
      document.body.appendChild(this._canvas);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      window.console.warn('Canvas Context Error: ' + e.toString());
      return;
    }
    this.onDraw();
  }

  setOptions(options: RibbonsOptions) {
    Object.assign(this._options, options);
  }

  addRibbon() {
    const dir = Math.round(this._suptool.random(1, 9)) > 5 ? 'right' : 'left';
    let stop = 1000;
    const hide = 200;
    const min = 0 - hide;
    const max = this._width + hide;
    let movex = 0;
    let movey = 0;
    const startx = dir === 'right' ? min : max;
    let starty = Math.round(this._suptool.random(0, this._height));
    if (/^(min|top)$/i.test(this._options.verticalPosition)) {
      starty = 0 + hide;
    } else if (/^(bottom|max)$/i.test(this._options.verticalPosition)) {
      starty = this._height - hide;
    } else if (/^(middle|center)$/i.test(this._options.verticalPosition)) {
      starty = this._height / 2;
    }
    const ribbon: RibbonSection[] = [];
    const point1 = new Point(startx, starty);
    const point2 = new Point(startx, starty);
    let point3;
    let color = Math.round(this._suptool.random(0, 360));
    let delay = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (stop <= 0) break;
      stop--;
      movex = Math.round(
        (Math.random() * 1 - 0.2) * this._options.horizontalSpeed,
      );
      movey = Math.round((Math.random() * 1 - 0.5) * (this._height * 0.25));
      point3 = new Point(point2.x, point2.y);
      if (dir === 'right') {
        point3.add(movex, movey);
        if (point2.x >= max) break;
      } else if (dir === 'left') {
        point3.subtract(movex, movey);
        if (point2.x <= min) break;
      }
      ribbon.push({
        point1: new Point(point1.x, point1.y),
        point2: new Point(point2.x, point2.y),
        point3,
        color,
        dir,
        delay,
        alpha: 0,
        phase: 0,
      });
      point1.copy(point2);
      point2.copy(point3);
      delay += 4;
      color += this._options.colorCycleSpeed;
    }
    this._ribbons.push(ribbon);
  }

  drawRibbonSection(section: RibbonSection) {
    if (section) {
      if (section.phase >= 1 && section.alpha <= 0) {
        return true;
      }
      if (section.delay <= 0) {
        section.phase += 0.01;
        section.alpha = Math.sin(section.phase) * 1;
        section.alpha = section.alpha <= 0 ? 0 : section.alpha;
        section.alpha = section.alpha >= 1 ? 1 : section.alpha;
        if (this._options.animateSections) {
          const mod = Math.sin(1 + (section.phase * Math.PI) / 2) * 0.1;
          if (section.dir === 'right') {
            section.point1.add(mod, 0);
            section.point2.add(mod, 0);
            section.point3.add(mod, 0);
          } else {
            section.point1.subtract(mod, 0);
            section.point2.subtract(mod, 0);
            section.point3.subtract(mod, 0);
          }
          section.point1.add(0, mod);
          section.point2.add(0, mod);
          section.point3.add(0, mod);
        }
      } else {
        section.delay -= 0.5;
      }
      const s = this._options.colorSaturation;
      const l = this._options.colorBrightness;
      const c = `hsla(${section.color}, ${s}, ${l}, ${section.alpha})`;
      this._context.save();
      if (this._options.parallaxAmount !== 0) {
        this._context.translate(0, this._scroll * this._options.parallaxAmount);
      }
      this._context.beginPath();
      this._context.moveTo(section.point1.x, section.point1.y);
      this._context.lineTo(section.point2.x, section.point2.y);
      this._context.lineTo(section.point3.x, section.point3.y);
      this._context.fillStyle = c;
      this._context.fill();
      if (this._options.strokeSize > 0) {
        this._context.lineWidth = this._options.strokeSize;
        this._context.strokeStyle = c;
        this._context.lineCap = 'round';
        this._context.stroke();
      }
      this._context.restore();
    }
    return false;
  }

  onDraw() {
    for (let i = 0, t = this._ribbons.length; i < t; ++i) {
      if (!this._ribbons[i]) {
        this._ribbons.splice(i, 1);
      }
    }
    this._context.clearRect(0, 0, this._width, this._height);
    for (let j = 0; j < this._ribbons.length; ++j) {
      const ribbon = this._ribbons[j];
      const numSections = ribbon.length;
      let numDone = 0;
      for (let k = 0; k < numSections; ++k) {
        if (this.drawRibbonSection(ribbon[k])) {
          numDone++;
        }
      }
      if (numDone >= numSections) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        this._ribbons[j] = null;
      }
    }
    if (this._ribbons.length < this._options.ribbonCount) {
      this.addRibbon();
    }
    requestAnimationFrame(this.onDraw);
  }

  onResize() {
    const screen = this._suptool.screenInfo();
    this._width = screen.width;
    this._height = screen.height;
    if (this._canvas) {
      this._canvas.width = this._width;
      this._canvas.height = this._height;
      if (this._context) {
        this._context.globalAlpha = this._options.colorAlpha;
      }
    }
  }

  onScroll() {
    const screen = this._suptool.screenInfo();
    this._scroll = screen.scrollY;
  }
}

class SupTool {
  _window: Window;
  _body: HTMLElement;
  _document: HTMLElement;

  constructor() {
    this._window = window;
    this._body = document.body;
    this._document = document.documentElement;
  }

  random(p0: number, p1: number) {
    // if (arguments.length === 1) {
    //   return this.random(0, p0)
    // } else if (arguments.length === 2) {
    return Math.random() * (p1 - p0) + p0;
    // }
    // return 0
  }

  screenInfo() {
    const width = Math.max(
      0,
      this._window.innerWidth ||
        this._document.clientWidth ||
        this._body.clientWidth ||
        0,
    );
    const height = Math.max(
      0,
      this._window.innerHeight ||
        this._document.clientHeight ||
        this._body.clientHeight ||
        0,
    );
    const scrollX =
      Math.max(
        0,
        this._window.pageXOffset ||
          this._document.scrollLeft ||
          this._body.scrollLeft ||
          0,
      ) - (this._document.clientLeft || 0);
    const scrollY =
      Math.max(
        0,
        this._window.pageYOffset ||
          this._document.scrollTop ||
          this._body.scrollTop ||
          0,
      ) - (this._document.clientTop || 0);

    return {
      width,
      height,
      radio: width / height,
      centerx: width / 2,
      centery: height / 2,
      scrollX,
      scrollY,
    };
  }

  mouseInfo(e: MouseEvent) {
    const screnn = this.screenInfo();
    const mousex = e ? Math.max(0, e.pageX || e.clientX || 0) : 0;
    const mousey = e ? Math.max(0, e.pageY || e.clientY || 0) : 0;

    return {
      mousex,
      mousey,
      centerx: mousex - screnn.width / 2,
      centery: mousey - screnn.height / 2,
    };
  }
}

new Ribbons({
  colorSaturation: '60%',
  colorBrightness: '50%',
  colorAlpha: 0.5,
  colorCycleSpeed: 5,
  verticalPosition: 'top',
  horizontalSpeed: 200,
  ribbonCount: 3,
  strokeSize: 0,
  parallaxAmount: -0.2,
  animateSections: true,
});
