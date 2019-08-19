/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   2D Lattice-Boltzmann 
 *
 * PROGRAMMER   :   EVAN NEWMAN based on code from ABOUZAR KABOUDIAN
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
*/
define([    'require',
            'shader!PassThrough.vert',
            'shader!ComputeValues.frag',
            'shader!Init.frag',
            'shader!Collision.frag',
            'shader!Streaming.frag',
            './LBMLib',
            'Abubu/Abubu'
            ],
function(   require,
            vertPassThroughShader,
            computeValuesShader,
            initShader,
            collisionShader,
            streamingShader,
            LBMLib,
            Abubu
            ){
//"use strict" ;

/* Global Variables */
var env;
var gui;
var mainCanvas;

function Environment(){
      this.isRunning = true;
      this.viscosity   = 0.02;
      this.width       = 400;
      this.height      = 400;
      this.dt          = 1.0;
      this.dx          = 1.0;
      this.time        = 0.0;

      // display stuff
      this.frameRatio    = 10; // updates per render 
      this.displayWidth  = 900;
      this.displayHeight = 900;

}

function createGUI() {
      env.gui = new Abubu.Gui();
      gui = env.gui.addPanel({width:180});

      gui.mdlPrmFldr  =   gui.addFolder( 'Model Controls'   );
      gui.mdlPrmFldr.add(env, 'viscosity').onChange(function() {
            env.stream.uniforms.viscosity.value = env.viscosity;
            env.collide.uniforms.viscosity.value = env.viscosity;
            env.init.uniforms.viscosity.value = env.viscosity;
      });
      gui.mdlPrmFldr.add( env, 'time').name('Time [lat s]').listen();
      gui.mdlPrmFldr.add( env, 'reset').name('Reset');
      gui.mdlPrmFldr.add( env, 'toggleStart').name('Toggle Start');
      gui.mdlPrmFldr.open();
}

function run() {
      env = new Environment();

      // Create the canvas
      mainCanvas = document.createElement('canvas');
      document.body.append(mainCanvas);
      mainCanvas.width = env.displayWidth;
      mainCanvas.height = env.displayHeight;

      // Add the stats thing (framerate stuff)
      var stats = new Stats();
      document.body.appendChild(stats.domElement);

      // Define render targets as textures
      env.e_n_s_e_w       = new Abubu.Float32Texture(env.width, env.height);
      env.o_n_s_e_w       = new Abubu.Float32Texture(env.width, env.height);
      env.e_ne_se_nw_sw   = new Abubu.Float32Texture(env.width, env.height);
      env.o_ne_se_nw_sw   = new Abubu.Float32Texture(env.width, env.height);
      env.e_n0_rho_ux_uy  = new Abubu.Float32Texture(env.width, env.height);
      env.o_n0_rho_ux_uy  = new Abubu.Float32Texture(env.width, env.height);
      env.domain          = new Abubu.Float32Texture(env.width, env.height);
      env.computed_values  = new Abubu.Float32Texture(env.width, env.height);

      env.init = new Abubu.Solver({
            vertexShader    : vertPassThroughShader.value,
            fragmentShader  : initShader.value,
            uniforms        : {
                  viscosity       : {type: 'f', value: env.viscosity},
                  u0              : {type: 'f', value: env.u0},
                  dt              : {type: 'f', value: env.dt},
                  dx              : {type: 'f', value: env.dx},
                  width           : {type: 'f', value: env.width},
                  height          : {type: 'f', value: env.height}
            },
            renderTargets   : {
                  e_n_s_e_w       : {location: 0, target: env.e_n_s_e_w},
                  o_n_s_e_w       : {location: 1, target: env.o_n_s_e_w},
                  e_ne_se_nw_sw   : {location: 2, target: env.e_ne_se_nw_sw},
                  o_ne_se_nw_sw   : {location: 3, target: env.o_ne_se_nw_sw}, 
                  e_n0_rho_ux_uy  : {location: 4, target: env.e_n0_rho_ux_uy}, 
                  o_n0_rho_ux_uy  : {location: 5, target: env.o_n0_rho_ux_uy},
                  domain          : {location: 6, target: env.domain}
            },
            canvasTarget : false
      });

      env.collision = new Abubu.Solver({
            vertexShader    : vertPassThroughShader.value,
            fragmentShader  : collisionShader.value,
            uniforms        : {
                  in_n_s_e_w      : {type: 't', value: env.e_n_s_e_w},
                  in_ne_se_nw_sw  : {type: 't', value: env.e_ne_se_nw_sw},
                  in_n0_rho_ux_uy : {type: 't', value: env.e_n0_rho_ux_uy},
                  domain          : {type: 't', value: env.domain},
                  viscosity       : {type: 'f', value: env.viscosity},
                  dt              : {type: 'f', value: env.dt},
                  dx              : {type: 'f', value: env.dx}
            },
            renderTargets   : {
                  out_n_s_e_w     : {location: 0, target: env.o_n_s_e_w},
                  out_ne_se_nw_sw : {location: 1, target: env.o_ne_se_nw_sw},
                  out_n0_rho_ux_uy: {location: 2, target: env.o_n0_rho_ux_uy}
            },
            canvasTarget : false
      });

      env.streaming = new Abubu.Solver({
            vertexShader    : vertPassThroughShader.value,
            fragmentShader  : streamingShader.value,
            uniforms        : {
                  in_n_s_e_w      : {type: 't', value: env.o_n_s_e_w},
                  in_ne_se_nw_sw  : {type: 't', value: env.o_ne_se_nw_sw},
                  in_n0_rho_ux_uy : {type: 't', value: env.o_n0_rho_ux_uy},
                  domain          : {type: 't', value: env.domain},
            },
            renderTargets   : {
                  out_n_s_e_w     : {location: 0, target: env.e_n_s_e_w},
                  out_ne_se_nw_sw : {location: 1, target: env.e_ne_se_nw_sw},
                  out_n0_rho_ux_uy: {location: 2, target: env.e_n0_rho_ux_uy}
            },
            canvasTarget : false
      });

      env.computeValues = new Abubu.Solver({
            vertexShader     : vertPassThroughShader.value,
            fragmentShader   : computeValuesShader.value,
            uniforms         : {
                  n0_rho_ux_uy  : {type: 't', value: env.o_n0_rho_ux_uy},
            },
            renderTargets    : {
                  values        : {location: 0, target: env.computed_values},
            },
            canvasTarget : false
      });

      env.disp = new Abubu.Plot2D({
            //target   : env.o_n0_rho_ux_uy,
            //target   : env.domain,
            target   : env.computed_values,
            phase    : env.domain,
            phaseColor : [1.,1.0,1.0,1],
            channel  : 'b',
            colormap : 'jet',
            canvas   : mainCanvas,
            minValue : 0.0,
            maxValue : 0.03,
            colorbar : true,
            unit     : '',
      });

      env.pointVisualizer = new LBMLib.FieldPointPlot({
            canvas : mainCanvas,
            field  : env.computed_values,
            clear  : true,
            //clearColor : [0.8, 0.8, 0.8, 1.0],
            colorMax : 0.23,
            speedFactor : 0.03,
            colorMap : 'darkRainbow'
      });

      env.reset = function() {
            env.time = 0;
            env.init.render();
            env.disp.initialize();
            env.computeValues.render();
            env.pointVisualizer.render();
            //env.disp.render();
      }

      env.toggleStart = function() {
            this.isRunning = !this.isRunning;
      }

      createGUI();

      env.render = function() {
            if (env.isRunning) {
                  env.startDate = performance.now();
                  stats.update();

                  for (var i = 0; i < env.frameRatio; i++) { 
                        env.time += 1;
                        env.collision.render();
                        env.streaming.render();       
                  }

                  env.endDate = performance.now();
                  env.lapsed += (env.endDate - env.startDate);

                  env.computeValues.render();
                  //env.disp.render();
                  env.pointVisualizer.render();
            }
            requestAnimationFrame(env.render); // loop the render function
      }

      document.env = env;
      env.reset();
      env.render();
}

run();
});