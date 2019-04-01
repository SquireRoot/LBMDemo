/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   2D Lattice-Boltzmann 
 *
 * PROGRAMMER   :   EVAN NEWMAN based on code from ABOUZAR KABOUDIAN
 * DATE         :   Sat 30 Oct 2019 
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
*/
define([    'require',
            'shader!PointPlt.vert',
            'shader!PointPlt.frag',
            'shader!PassThrough.vert',
            'shader!init.frag',
            'Abubu/Abubu'
            ],
function(   require,
            vertPointPlt,
            fragPointPlt,
            vertPassThrough,
            fragInit,
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
      this.u0         = 0.17;

      /* Solver Parameters        */
      this.width       =   900;
      this.height      =   900;
      this.dt          =  1.0;
      this.dx          =  1.0;
      this.time        = 0.0;
      this.frameRate   =   2400;

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
      mainCanvas.width = env.width;
      mainCanvas.height = env.height;

      // Add the stats thing (framerate stuff)
      var stats = new Stats();
      document.body.appendChild(stats.domElement);

      // Define render targets as textures
      // TODO: add render targets
      env.field = new Abubu.Float32Texture(env.width, env.height);

      // init shader
      env.init = new Abubu.Solver({
            vertexShader     : vertPassThrough.value,
            fragmentShader   : fragInit.value,
            renderTargets    : {
                  field : { location : 0, target: env.field}
            }
      });

      // Point plotting solver
      env.pointPlotter = new Abubu.Solver({
            vertexShader     : vertPointPlt.value,
            fragmentShader   : fragPointPlt.value,

            geometry         : {
                  vertices   : [
                        0.1, 0.1, 0.0,
                        0.9, 0.1, 0.0,
                        0.1, 0.9, 0.0,
                  ],
                  noVerticies : 3,
                  noCoords    : 3,
                  normalize   : false,
                  primitive   : 'POINTS'
            },

            canvas         : mainCanvas,
            canvasTarget   : true
      });

      createGUI();

      env.render = function() {
            if (env.running) {
                  env.startDate = performance.now();
                  stats.update();
                  env.time += 1;
                  env.pointPlotter.render();
                  env.endDate = performance.now();
                  env.lapsed += (env.endDate - env.startDate);
            }
            requestAnimationFrame(env.render); // loop the render function
      }

      document.env = env;
      env.render();
}

run();
});