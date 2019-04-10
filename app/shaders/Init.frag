#version 300 es

precision highp float;
precision highp int;

uniform float u0;
uniform float viscosity;
uniform float dt;
uniform float dx;

layout (location = 0 )  out vec4 e_n_s_e_w;
layout (location = 1 )  out vec4 o_n_s_e_w;
layout (location = 2 )  out vec4 e_ne_se_nw_sw;
layout (location = 3 )  out vec4 o_ne_se_nw_sw;
layout (location = 4 )  out vec4 e_n0_rho_ux_uy;
layout (location = 5 )  out vec4 o_n0_rho_ux_uy;

void main() {
	vec2    u = vec2(0.0, 0.0); // initial velocity
    float   rho  = 1.0;         // initial density

    float   c   = dx/dt;                               // fluid speed
    float   coef1 = 3.0 / c;                           // first coef of equilibrium func
    float   coef2 = (coef1 * 3.0)/(2.0 * c);           // second coef of equilibrium func
    float   tau = 3.0*viscosity*(dt/(dx * dx)) + 0.5;  // relaxation time

	// term 1 and 4 of equilibrium func
    float oneMinusLastTerm = 1.0 - ((coef2 * dot(u, u)) / 3.0); 
    
    float four9thsRho  = 4./9.  * rho; 
    float one9thRho    = 1./9.  * rho;
    float one36thRho   = 1./36. * rho;

    float n0  = four9thsRho * oneMinusLastTerm;
    float nE  = one9thRho   * (coef1*(u.x)        +coef2*u.x*u.x        +oneMinusLastTerm);
    float nW  = one9thRho   * (coef1*(-u.x)       +coef2*u.x*u.x        +oneMinusLastTerm);
    float nN  = one9thRho   * (coef1*(u.y)        +coef2*u.y*u.y        +oneMinusLastTerm);
    float nS  = one9thRho   * (coef1*(-u.y)       +coef2*u.y*u.y        +oneMinusLastTerm);

    float uxPlusuy  = u.x + u.y; // NE dot u
    float uxMinusuy = u.x - u.y; // SE dot u
    float nNE = one36thRho  * (coef1*uxPlusuy     +coef2*uxPlusuy*uxPlusuy    +oneMinusLastTerm);
    float nSE = one36thRho  * (coef1*uxMinusuy    +coef2*uxMinusuy*uxMinusuy  +oneMinusLastTerm);
    float nNW = one36thRho  * (coef1*(-uxMinusuy) +coef2*uxMinusuy*uxMinusuy  +oneMinusLastTerm);
    float nSW = one36thRho  * (coef1*(-uxPlusuy)  +coef2*uxPlusuy*uxPlusuy    +oneMinusLastTerm);

    e_n_s_e_w = vec4(nN, nS, nE, nW);
    o_n_s_e_w = vec4(nN, nS, nE, nW);

    e_ne_se_nw_sw = vec4(nNE, nSE, nNW, nSW);
    o_ne_se_nw_sw = vec4(nNE, nSE, nNW, nSW);
    
    e_n0_rho_ux_uy = vec4(n0, rho, u.x, u.y);
    o_n0_rho_ux_uy = vec4(n0, rho, u.x, u.y);
}