var TrailLineWidth = 1;

// default color
var LineColor = {
    r: 200,
    g: 40,
    b: 255,
    a: 1,
}


function renderLine(ctx, coords, rgb, opacity, width, closePath) {
    
    if(closePath) {ctx.beginPath();}
    ctx.moveTo(Math.floor(coords.x0),Math.floor(coords.y0));
    ctx.lineTo(Math.floor(coords.x1),Math.floor(coords.y1));
    ctx.lineWidth=width;
    ctx.filter = 'blur(0px)';
    ctx.strokeStyle=`rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`;
    ctx.stroke();
    if(closePath) {ctx.closePath();}
}


class Pulse {
  constructor(ctx, initPos, initForce, size, boundry, props, onEnd, onBoundry) {
    this.ctx = ctx;
    this.hide = false;
    this.segments = {};
    this.hideUntil = 0;
    this.activeIndex=1;
    this.segmentInterval = props.interval;//4;
    this.segmentFadeFactor = props.fadeFactor;//1.8 // higher number = faster fade

    this.width = size.x;
    this.height = size.y;
    this.initForce = initForce;
    this.initPos = initPos;
    this.boundry = boundry;
    this.onEnd =  onEnd;
    this.onBoundry =  onBoundry;
    this.init();
  }

  init() {
    this.fx = this.initForce.x; // 5000
    this.fy = this.initForce.y; // 0
    this.dx = this.initPos.x
    this.dy = this.initPos.y
    this.vx = 0;
    this.vy = 0;
    this.lastSegmentDeployedTime = 0;
    this.lastSegmentX = this.dx;
    this.lastSegmentY = this.dy;
  }

  deleteSegement(s) {
    delete this.segments[s.index];
  }

  makeSegement() {
    let segment = new LineSegment(this.ctx, this.dx, this.dy, this.lastSegmentX, this.lastSegmentY, this.segmentFadeFactor, this.deleteSegement.bind(this));
    segment.index = this.activeIndex;
    this.segments[this.activeIndex] = segment;
    this.activeIndex = this.activeIndex + 1;

    this.lastSegmentX = this.dx;
    this.lastSegmentY = this.dy;
    this.lastSegmentDeployedTime = 0;
  }

  updateSegments(dt, time) {
    // don't make more when hidden
    if(!this.hide) {
      if (this.lastSegmentDeployedTime +  this.segmentInterval < time) {
          this.makeSegement();
          this.lastSegmentDeployedTime = time;
      }
    }

    Object.keys(this.segments).forEach((index)=>{
        this.segments[index].draw(dt,time);
    });
  }

  calcPos(dt) {
    let ax = this.fx/1; // 1 == mass
    let ay = this.fy/1; // 1 == mass

    this.vx =  this.vx + ax*dt;
    this.vy =  this.vy + ay*dt;

    //console.log(this.vx);
    this.dx = this.dx + this.vx*dt;
    this.dy = this.dy + this.vy*dt;
  }
  endPulse(time, limit) {
    //this.hideUntil = time + limit;
    this.hide = true;
    if(this.onBoundry) {
      this.onBoundry(this);
    }
  }

  restartPulse() {
    this.init();
    this.hide = false;
  }

  draw(dt, time) {
    dt = dt/1000; // back to seconds;
    this.updateSegments(dt, time);

    //if(this.hideUntil > time) {
    if(this.hide) {
        //console.log(Object.keys(this.segments));
        if(Object.keys(this.segments).length === 0) {
            // when all the segments are dead, call the caller
            if(this.onEnd) {
              this.onEnd(this);
            }
        }
        return;
    }
    this.calcPos(dt);

    //let dist = Math.sqrt(Math.pow(this.dx - this.initPos.x, 2) + Math.pow(this.dy - this.initPos.y, 2), 2);
    let distX = Math.sqrt(Math.pow(this.dx - this.initPos.x, 2),2);
    let distY = Math.sqrt(Math.pow(this.dy - this.initPos.y, 2),2);

    let limitX = Math.sqrt(Math.pow(this.boundry.x - this.initPos.x, 2),2);
    let limitY = Math.sqrt(Math.pow(this.boundry.y - this.initPos.y, 2),2);


    if(distX > limitX) {
        // make 1 last segment to finish off line;
        this.dx = this.boundry.x
        this.makeSegement();
        this.endPulse(time, 50);
        return;
    }
    if (distY > limitY) {
        // make 1 last segment to finish off line;
        this.dy = this.boundry.y
        this.makeSegement();
        this.endPulse(time, 50);
        return;
    }
    var ctx = this.ctx;

    renderLine(ctx, {
        x0: this.dx,
        y0: this.dy,
        x1: this.lastSegmentX,
        y1: this.lastSegmentY,
      }, LineColor, 1, TrailLineWidth);
      
    // pulse ball
    ctx.beginPath()
    ctx.ellipse(this.dx, this.dy, this.width, this.height, 0, 0, 360);

    //ctx.lineWidth=1.5;
    ctx.fillStyle=`rgba(${LineColor.r},${LineColor.g},${LineColor.b}, 1)`;
    ctx.filter = 'blur(5px)';
    ctx.fill();
    ctx.filter = 'blur(15px)';
    ctx.fill();
    ctx.fillStyle="#fff";
    ctx.filter = 'blur(0px)';
    ctx.fill();
    ctx.closePath()

    
  }
}


class Ripple {

  constructor(ctx, startPos, rgb, props, callback) {
    this.ctx = ctx;
    this.x = startPos.x
    this.y = startPos.y
    this.size = props.startRadius;
    this.opacity = 0.4 //rgb.a;

    this.fadeFactor = props.fadeFactor;
    this.speed = props.speed;
    this.onDone = callback;
    this.rgb = rgb;
    this.width = 1;
  }
  draw(dt, time) {
    //fadeTime = fadeTime = fadeTime - fadeTime*dt
    if(this.opacity <= 0) {
        this.onDone(this);
    }
    this.ctx.beginPath()
    this.ctx.ellipse(this.x, this.y, this.size, this.size, 0, 0, 360);
    this.ctx.lineWidth=4;
    this.ctx.strokeStyle=`rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},${this.opacity*0.25})`;
    this.ctx.filter = `blur(${this.width}px`;
    this.ctx.stroke();
    
    this.ctx.filter = 'blur(0)';
    this.ctx.ellipse(this.x, this.y, this.size, this.size, 0, 0, 360);
    this.ctx.lineWidth=1;
    this.ctx.strokeStyle=`rgba(255,255,255,${this.opacity})`;
    this.ctx.stroke();
    
    this.ctx.closePath()

    this.size = (this.speed * dt/20) + this.size;
    this.opacity  = this.opacity - (dt * (this.fadeFactor/2500));
    this.width  = (this.fadeFactor * dt/1000) + this.width;
  }
}


class LineSegment {

  constructor(ctx, x, y, x1, y1, fadeFactor, callback) {
    this.ctx = ctx;
    this.x = x
    this.y = y
    this.x1 = x1
    this.y1 = y1
    this.opacity = 1;
    this.fadeFactor = fadeFactor;
    this.onDone = callback;
  }
  draw(dt, time) {
    //fadeTime = fadeTime = fadeTime - fadeTime*dt
    if(this.opacity <= 0) {
        this.onDone(this);
    }

    this.ctx.beginPath();
    renderLine(this.ctx, {
        x0: this.x,
        y0: this.y,
        x1: this.x1,
        y1: this.y1,
      }, LineColor, this.opacity, TrailLineWidth, false);
    this.ctx.closePath();
    this.opacity  = this.opacity - (dt * this.fadeFactor);
    
  }
}
class Crosshairs {

  constructor(ctx, color) {
    this.ctx = ctx;
    this.activeIndex = 1;
    this.pulses = {};
    this.ripples = {};
    this.pulseDeployDelay = 900;
    this.lastPulseDeploy = 0;
    this.allHidden = false;
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    LineColor.r = color.r;
    LineColor.g = color.g;
    LineColor.b = color.b;
    LineColor.a = color.a;
  }
  deletePulse(p) {
    delete this.pulses[p.index];
  }
  deleteRipple(r) {
    delete this.ripples[r.index];
  }
  spawnRipple(){
      //this.ripples[this.activeIndex] = new Ripple(this.ctx, {x: window.innerWidth/2, y: window.innerHeight/2}, LineColor, {fadeFactor:1, startRadius:2, speed:1}, this.deleteRipple.bind(this))
      this.ripples[this.activeIndex] = new Ripple(this.ctx, {x: this.ctx.canvas.width/2, y: this.ctx.canvas.height/2}, LineColor, {fadeFactor:1, startRadius:2, speed:2}, this.deleteRipple.bind(this))
      this.ripples[this.activeIndex].index = this.activeIndex;
      this.activeIndex += 1;
  }
  draw(dt, time) {
    // props for pulse
    var pulseProps = {interval: 20, fadeFactor:1.5};
    var speed = 2500;

    var size = {
      length: 20,
      width: 3,
    }


    var ctx = this.ctx

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    
    // basic x hairs
    renderLine(ctx,{x0:window.innerWidth/2, y0: 0, x1:window.innerWidth/2, y1: window.innerHeight}, {r:255,g:255,b:255}, 0.2, 1);
    renderLine(ctx,{x0:0, y0: window.innerHeight/2, x1:window.innerWidth, y1: window.innerHeight/2}, {r:255,g:255,b:255}, 0.2, 1);



    // draw pulses
    let keys = Object.keys(this.pulses);
    for(var i = 0; i < keys.length; i++) {
        let index = keys[i];
        this.pulses[index].draw(dt, time);
    }
    // draw ripples
    keys = Object.keys(this.ripples);
    for(var j = 0; j < keys.length; j++) {
        let index = keys[j];
        this.ripples[index].draw(dt, time);
    }

    

    if(this.lastPulseDeploy < time && this.allHidden === false) {
    //if (keys.length==0) {
        this.lastPulseDeploy = time + this.pulseDeployDelay;
        //console.log(Object.keys(this.pulses).length);
        //this.pulses = new Array(); // clear out array

        // RIGHT
        this.pulses[this.activeIndex] = new Pulse(ctx, {x: window.innerWidth+10, y: window.innerHeight / 2}, {x: speed*-1, y: 0}, {x: size.length, y: size.width}, {x: window.innerWidth/2, y: window.innerHeight}, pulseProps,  this.deletePulse.bind(this), this.spawnRipple.bind(this))
        this.pulses[this.activeIndex].index = this.activeIndex;
        this.activeIndex += 1;

        // LEFT
        this.pulses[this.activeIndex] = new Pulse(ctx, {x: -10, y: window.innerHeight / 2}, {x: speed, y: 0}, {x: size.length, y: size.width}, {x: window.innerWidth/2, y: window.innerHeight}, pulseProps, this.deletePulse.bind(this))
        this.pulses[this.activeIndex].index = this.activeIndex;
        this.activeIndex += 1;


        // TOP
        let yStartTop = (window.innerHeight - window.innerWidth)/2 - 10;
        let yStartBottom = (yStartTop * -1) + window.innerHeight;

        this.pulses[this.activeIndex] = new Pulse(ctx, {x: window.innerWidth/2, y: yStartTop}, {x: 0, y: speed}, {y: size.length, x: size.width}, {x: window.innerWidth, y: window.innerHeight/2}, pulseProps, this.deletePulse.bind(this))
        this.pulses[this.activeIndex].index = this.activeIndex;
        this.activeIndex += 1;

        // BOTTOM
        this.pulses[this.activeIndex] = new Pulse(ctx, {x: window.innerWidth/2, y: yStartBottom}, {x: 0, y: speed*-1}, {y: size.length, x: size.width}, {x: window.innerWidth, y: window.innerHeight/2}, pulseProps, this.deletePulse.bind(this))
        this.pulses[this.activeIndex].index = this.activeIndex;
        this.activeIndex += 1;
     }
  }
}

class Spinner {

  constructor(ctx) {
    this.ctx = ctx;
    this.activeIndex = 1;
    this.pulses = {};
    this.ripples = {};
    this.pulseDeployDelay = 2800;
    this.lastPulseDeploy = 0;
    this.allHidden = false;
  }
  deletePulse(p) {
    delete this.pulses[p.index];
  }
  deleteRipple(r) {
    delete this.ripples[r.index];
  }
  spawnRipple(){
      this.ripples[this.activeIndex] = new Ripple(this.ctx, {x: this.ctx.canvas.width/2, y: this.ctx.canvas.height/2}, {r: 0,g: 255,b: 40,a: 1.5}, {fadeFactor:1, startRadius:2, speed:2}, this.deleteRipple.bind(this))
      this.ripples[this.activeIndex].index = this.activeIndex;
      this.activeIndex += 1;
  }
  draw(dt, time) {

    var ctx = this.ctx

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;


    // draw pulses
    let keys = Object.keys(this.pulses);
    for(var i = 0; i < keys.length; i++) {
        let index = keys[i];
        this.pulses[index].draw(dt, time);
    }
    // draw ripples
    keys = Object.keys(this.ripples);
    for(var j = 0; j < keys.length; j++) {
        let index = keys[j];
        this.ripples[index].draw(dt, time);
    }


    if(this.lastPulseDeploy < time && this.allHidden === false) {
        this.lastPulseDeploy = time + this.pulseDeployDelay;
        this.spawnRipple();
        this.activeIndex += 1;
     }
  }
}

export {
  Spinner,
  Crosshairs
}