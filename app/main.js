/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   2D Lattice-Boltzmann 
 *
 * PROGRAMMER   :   EVAN NEWMAN based on code from ABOUZAR KABOUDIAN
 * DATE         :   Sat 30 Oct 2019 
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
*/
define([    'require',
            'shader!PassThrough.vert',
            'shader!ComputeValues.frag',
            'shader!init.frag',
            'Abubu/Abubu'
            ],
function(   require,
            vertPassThroughShader,
            computeValuesShader,
            initShader,
            Abubu
            ){
"use strict" ;

/* Global Variables */
var params;
var env;
var gui;
var mainCanvas;

function createGUI() { // Initialize the GUI
      env.gui = new Abubu.Gui();
      gui = env.gui.addPanel({width:300});

      // Model Parameters
      gui.mdlPrmFldr  =   gui.addFolder( 'Model Parameters'   );

      gui.mdlPrmFldr.add(env, 'viscosity').onChange(function() {
            env.stream.uniforms.viscosity.value = env.viscosity;
            env.collide.uniforms.viscosity.value = env.viscosity;
            env.init.uniforms.viscosity.value = env.viscosity;
      });

      gui.mdlPrmFldr.add(env, 'u0').onChange(function() {
            env.stream.uniforms.u0.value = env.u0;
            env.init.uniforms.u0.value = env.u0;
      });

      gui.mdlPrmFldr.add(env, 'dt').onChange(function() {
            env.stream.uniforms.dt.value = env.dt;
            env.collide.uniforms.dt.value = env.dt;
            env.init.uniforms.dt.value = env.dt;
      });

      gui.mdlPrmFldr.add(env, 'dx').onChange(function() {
            env.stream.uniforms.dx.value = env.dx;
            env.collide.uniforms.dx.value = env.dx;
            env.init.uniforms.dx.value = env.dx;
      });

      gui.mdlPrmFldr.open();
}

function Environment(){ // Setup the environment
      this.running = true;

      /* model parameters         */
      this.viscosity   = 0.05;
      this.u0          = 0.17;

      /* Solver Parameters        */
      this.width       = 400;
      this.height      = 400;
      this.dt          = 1.0;
      this.dx          = 1.0;
      this.time        = 0.0;

      // display stuff
      this.frameRate     = 2400;
      this.displayWidth  = 400;
      this.displayHeight = 400;

      /* Solve                    */
      this.solve       = function() {
            this.running = !this.running;
            return;
      };
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

      env.computedValues  = new Abubu.Float32Texture(env.width, env.height);
      env.simDomain       = new Abubu.Float32Texture(env.width, env.height);

      // init shader
      env.init = new Abubu.Solver({
            vertexShader     : vertPassThroughShader.value,
            fragmentShader   : initShader.value,
            uniforms         : {
                  viscosity       : { type : 'f', value : env.viscosity },
                  u0              : { type : 'f', value : env.u0        },
                  dt              : { type : 'f', value : env.dt        },
                  dx              : { type : 'f', value : env.dx        },
            },
            renderTargets    : {
                  e_n_s_e_w       : { location : 0, target: env.e_n_s_e_w         },
                  o_n_s_e_w       : { location : 1, target: env.o_n_s_e_w         },
                  e_ne_se_nw_sw   : { location : 2, target: env.e_ne_se_nw_sw     },
                  o_ne_se_nw_sw   : { location : 3, target: env.o_ne_se_nw_sw     }, 
                  e_n0_rho_ux_uy  : { location : 4, target: env.e_n0_rho_ux_uy    }, 
                  o_n0_rho_ux_uy  : { location : 5, target: env.o_n0_rho_ux_uy    },
            }
      });

      env.computeValues = new Abubu.Solver({
            vertexShader     : vertPassThroughShader.value,
            fragmentShader   : computeValuesShader.value,
            uniforms         : {
                  map    : { type : 't', value : env.o_n0_rho_ux_uy },
            },
            renderTargets    : {
                  values : { location : 0, target : env.computedValues},
            },
      });

      env.disp = new Abubu.Plot2D({
            target   : env.o_ne_se_nw_sw,
            channel  : 'a',
            colormap : 'jet',
            canvas   : mainCanvas,
            minValue : 0,
            maxValue : 1,
            colorbar : true,
            unit     : '',
      });

      createGUI();

      env.initialize = function() {
            env.init.render();
            env.disp.initialize();
            //env.disp.render();
      }

      env.render = function() {
            // if (env.running) {
            //       env.startDate = performance.now();
            //       stats.update();
            //       env.time += 1;
                  
            //       env.disp.updateTipt();
            //       env.endDate = performance.now();
            //       env.lapsed += (env.endDate - env.startDate);
            // }
            //env.computeValues.render();
            env.disp.updateTipt();
            env.disp.render();
            //requestAnimationFrame(env.render); // loop the render function
      }

      document.env = env;
      env.initialize();
      env.render();
}

run();
});