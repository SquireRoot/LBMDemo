/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   2D Lattice-Boltzmann 
 *
 * PROGRAMMER   :   EVAN NEWMAN based on code from ABOUZAR KABOUDIAN
 * DATE         :   Sat 30 Oct 2019 
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/
define([    'require',
            'shader!FieldPointPlot.vert',
            'shader!FieldPointPlot.frag',
            'shader!PassThrough.vert',
            'shader!FieldPointUpdate.frag',
            'Abubu/Abubu'
            ],
function(   require,
            fieldPointPlotVertShader,
            fieldPointPlotFragShader,
            passThroughShader,
            fieldPointUpdateShader,
            Abubu
){

/* TODO
change point color to field magnitude or set color
add stuff to configure ranges
phase?
add helper functions
*/

class FieldPointPlot {
      constructor(options = {}) {
            this.pointSize = Abubu.readOption(options.pointSize, 1);
            this.field = Abubu.readOption(options.field, null);
            this.canvas = Abubu.readOption(options.canvas, null);
            this.clear = Abubu.readOption(options.clear, false);
            this.clearColor = Abubu.readOption(options.clearColor, [0.0,0.0,0.0,0.0]);
            this.travelTime = Abubu.readOption(options.travelTime, 50);
            this.speedFactor = Abubu.readOption(options.speedFactor, 1);
            this.colorMin = Abubu.readOption(options.colorMin, 0);
            this.colorMax = Abubu.readOption(options.colorMax, 1);
            this.clrmName = Abubu.readOption(options.colorMap, 'darkRainbow');
            
            this.plotMagnitude = Abubu.readOption(options.plotMagnitude, true);
            this.plotTarget = Abubu.readOption(options.plotTarget, null);
            if (this.plotTarget != null) {
                  this.plotMagnitude = false;
            } else {
                  this.plotTarget = new Abubu.Float32Texture(1, 1);
            }

            if (this.field == null) {
                  delete this;
                  console.log('FieldPointPlot field needs to be defined');
                  return undefined;
            } if (this.canvas == null) {
                  delete this;
                  console.log('FieldPointPlot canvas needs to be defined');
                  return undefined;
            }

            this.width = Abubu.readOption(options.width, 
                                    Math.floor(3.0*this.canvas.width/4.0));
            this.height = Abubu.readOption(options.height,
                                    Math.floor(3.0*this.canvas.height/4.0));

            // Initialize point distance change textures
            this.pointFieldSize = this.width * this.height;
            this.pointFieldInit = new Float32Array(this.pointFieldSize*4);
            this.ePointDS = new Abubu.Float32Texture(
                  this.width,
                  this.height,
                  {data : this.pointFieldInit}
            );
            this.oPointDS = new Abubu.Float32Texture(
                  this.width,
                  this.height,
                  {data : this.pointFieldInit}
            );

            // Create random noise texture to offset point regeneration
            this.randInit = new Uint8Array(this.pointFieldSize);
            for (var i = 0; i < this.pointFieldSize; i++) {
                  this.randInit[i] = Math.floor(Math.random()*255);
            }
            this.randTimeOffset = new Abubu.Texture(
                  this.width, this.height,
                  'LUMINANCE', 'LUMINANCE', 'UNSIGNED_BYTE',
                  {data : this.randInit}
            );
            this.vertOffset = [0.5/this.width, 0.5/this.height];
            this.time = 0;

            this.pointUpdater = new Abubu.Solver({
                  vertexShader   : passThroughShader.value,
                  fragmentShader : fieldPointUpdateShader.value,
                  uniforms       : {
                        inPointDS   : {type: 't', value: this.ePointDS},
                        field       : {type: 't', value: this.field},
                        timeOffset  : {type: 't', value: this.randTimeOffset},
                        travelTime  : {type: 'i', value: this.travelTime},
                        speedFactor : {type: 'f', value: this.speedFactor},
                        time        : {type: 'i', value: this.time},
                        vertOffset  : {type: 'f2', value: this.vertOffset}
                  },
                  renderTargets  : {
                        outPointDS : {location: 0, target: this.oPointDS}
                  }
            });

            this.verts = new Float32Array(this.pointFieldSize*3);
            for (var x = 0; x < this.width; x++) {
                  for (var y = 0; y < this.height; y++) {
                        this.verts[3*(y*this.width + x)]   
                                          = (x+0.5)/this.width;
                        this.verts[3*(y*this.width + x)+1] 
                                          = (y+0.5)/this.height;
                        this.verts[3*(y*this.width + x)+2] = 0.0;
                  }
            }

            this.colormaps = Abubu.getColormaps(Abubu.getColormapList());
            this.clrm = this.colormaps[this.clrmName];

            this.pointPlotter = new Abubu.Solver({
                  vertexShader   : fieldPointPlotVertShader.value,
                  fragmentShader : fieldPointPlotFragShader.value,
                  geometry       : {
                        vertices    : this.verts,
                        noVerticies : this.pointFieldSize,
                        noCoords    : 3,
                        normalize   : false,
                        primitive   : 'POINTS'
                  },
                  uniforms       : {
                        size        : {type: 'f', value: this.pointSize},
                        newPointDS  : {type: 't', value: this.ePointDS},
                        oldPointDS  : {type: 't', value: this.oPointDS},
                        clrm        : {type: 't', value: this.clrm},
                        colorMax    : {type: 'f', value: this.colorMax},
                        colorMin    : {type: 'f', value: this.colorMin},
                        speedFactor : {type: 'f', value: this.speedFactor}
                  },
                  canvas       : this.canvas,
                  canvasTarget : true,
                  clear        : this.clear,
                  clearColor   : this.clearColor
            });
      }

      render() {
            this.pointPlotter.render();
            this.pointUpdater.render();

            if (this.time % 2 == 0) {
                  this.pointPlotter.setUniform('newPointDS', this.oPointDS);
                  this.pointPlotter.setUniform('oldPointDS', this.ePointDS);
                  this.pointUpdater.setUniform('inPointDS', this.oPointDS);
                  this.pointUpdater.setRenderTarget('outPointDS', this.ePointDS);
            } else {
                  this.pointPlotter.setUniform('newPointDS', this.ePointDS);
                  this.pointPlotter.setUniform('oldPointDS', this.oPointDS);
                  this.pointUpdater.setUniform('inPointDS', this.ePointDS);
                  this.pointUpdater.setRenderTarget('outPointDS', this.oPointDS); 
            }
            this.pointUpdater.setUniform('time', this.time);

            this.time++;
      }
}

return {
      FieldPointPlot : FieldPointPlot
}

});