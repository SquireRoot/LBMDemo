#version 300 es

precision highp float;
precision highp int;

uniform float u0;
uniform float viscosity;
uniform float dt;
uniform float dx;
uniform float width;
uniform float height;

in vec2 pixPos;

layout (location = 0)  out vec4 e_n_s_e_w;
layout (location = 1)  out vec4 o_n_s_e_w;
layout (location = 2)  out vec4 e_ne_se_nw_sw;
layout (location = 3)  out vec4 o_ne_se_nw_sw;
layout (location = 4)  out vec4 e_n0_rho_ux_uy;
layout (location = 5)  out vec4 o_n0_rho_ux_uy;
layout (location = 6)  out vec4 domain;

void main() {
    float i = 1.0/width;
    float j = 1.0/height;

    float x = pixPos.x - 0.5;
    float y = pixPos.y - 0.5;
    float radius = sqrt(x*x+y*y);
    vec2  u = vec2(0.0, 0.0); // initial velocity
    if (radius < 0.45 && radius > 0.01) {
        u.x = 0.2*y/(radius);
        u.y = -0.2*x/(radius);
    }
    
    domain = vec4(1.0,0.0,0.0,0.0);
    if (pixPos.y > (1.0-j) || pixPos.y < j
     || pixPos.x > (1.0-i) || pixPos.x < i) {
        domain.r = 0.0;
    }

    if (0.49 < pixPos.x-0.2 && pixPos.x-0.2 < 0.51
      &&0.49 < pixPos.y && pixPos.y < 0.51) {
        domain.r = 0.0;
    }

    // if (0.49 < pixPos.x-0.3 && pixPos.x-0.3 < 0.51
    //   &&0.49 < pixPos.y-0.00 && pixPos.y-0.00 < 0.51) {
    //     domain.r = 0.0;
    // }

    if (domain.r < 1.0) {
        u = vec2(0.0,0.0);
    }

    float rho  = 1.0; // initial density

    float c = dx/dt; // lattice velocity
    float coef1 = 3.0/c; // first eq dist coef
    float coef2 = (coef1 * 3.0)/(2.0 * c); // second eq dist coef
    // one minus the last eq dist term
    float oneMinusLastTerm = 1.0 - ((coef2 * dot(u, u)) / 3.0); 

    float four9thsRho = 4./9.  * rho; 
    float one9thRho   = 1./9.  * rho;
    float one36thRho  = 1./36. * rho;

    float eqN0 = four9thsRho*oneMinusLastTerm;
    float eqE = one9thRho*(coef1*(u.x)  +coef2*u.x*u.x +oneMinusLastTerm);
    float eqW = one9thRho*(coef1*(-u.x) +coef2*u.x*u.x +oneMinusLastTerm);
    float eqN = one9thRho*(coef1*(u.y)  +coef2*u.y*u.y +oneMinusLastTerm);
    float eqS = one9thRho*(coef1*(-u.y) +coef2*u.y*u.y +oneMinusLastTerm);

    float uxPlusuy  = u.x + u.y; // NE dot u
    float uxMinusuy = u.x - u.y; // SE dot u
    float eqNE = one36thRho*(coef1*uxPlusuy     +coef2*uxPlusuy*uxPlusuy   +oneMinusLastTerm);
    float eqSE = one36thRho*(coef1*uxMinusuy    +coef2*uxMinusuy*uxMinusuy +oneMinusLastTerm);
    float eqNW = one36thRho*(coef1*(-uxMinusuy) +coef2*uxMinusuy*uxMinusuy +oneMinusLastTerm);
    float eqSW = one36thRho*(coef1*(-uxPlusuy)  +coef2*uxPlusuy*uxPlusuy   +oneMinusLastTerm);

    // initialize the equillibrium distribution
    e_n_s_e_w = vec4(eqN, eqS, eqE, eqW);
    o_n_s_e_w = vec4(eqN, eqS, eqE, eqW);
    e_ne_se_nw_sw = vec4(eqNE, eqSE, eqNW, eqSW);
    o_ne_se_nw_sw = vec4(eqNE, eqSE, eqNW, eqSW);
    e_n0_rho_ux_uy = vec4(eqN0, rho, u.x, u.y);
    o_n0_rho_ux_uy = vec4(eqN0, rho, u.x, u.y);
}