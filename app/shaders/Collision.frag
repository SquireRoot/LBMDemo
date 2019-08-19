#version 300 es

precision highp float;
precision highp int;

in vec2 pixPos;

uniform float viscosity;
uniform float dt;
uniform float dx;

uniform sampler2D in_n_s_e_w;
uniform sampler2D in_ne_se_nw_sw;
uniform sampler2D in_n0_rho_ux_uy;
uniform sampler2D domain;

layout (location = 0) out vec4 out_n_s_e_w;
layout (location = 1) out vec4 out_ne_se_nw_sw;
layout (location = 2) out vec4 out_n0_rho_ux_uy;

#define isFluid(pos)  (texture(domain, pixPos).r > 0.5)

void main() {
	vec4 n_s_e_w = texture(in_n_s_e_w, pixPos);
	vec4 ne_se_nw_sw = texture(in_ne_se_nw_sw, pixPos);
	vec4 n0_rho_ux_uy = texture(in_n0_rho_ux_uy, pixPos);

    float nN  = n_s_e_w.r;
    float nS  = n_s_e_w.g;
    float nE  = n_s_e_w.b;
    float nW  = n_s_e_w.a;
    float nNE = ne_se_nw_sw.r;
    float nSE = ne_se_nw_sw.g;
    float nNW = ne_se_nw_sw.b;
    float nSW = ne_se_nw_sw.a;
    float n0  = n0_rho_ux_uy.r;

    // calculate macroscopic variables
    float rho = n0 + nN + nS + nE + nW + nNW + nNE + nSW + nSE ;
    vec2 u = vec2( 
    	(nE + nNE + nSE - nW - nNW - nSW)/rho,
    	(nN + nNE + nNW - nS - nSE - nSW)/rho
    );

    if (isFluid(pixPos)) {
	    // precache values
	    float c = dx/dt;
	    float coef1 = 3.0/c;
	    float coef2 = (coef1 * 3.0)/(2.0 * c);
	    float oneMinusLastTerm = 1.0 - ((coef2 * dot(u, u)) / 3.0); 
	    float oneOverTau = 1.0/(3.0*viscosity*(dt/(dx * dx)) + 0.5);

	    float four9thsRho = 4.0/9.0  * rho; 
	    float one9thRho   = 1.0/9.0  * rho;
	    float one36thRho  = 1.0/36.0 * rho;

	    // actual lattice boltzman equations
	    n0 += oneOverTau*(four9thsRho*oneMinusLastTerm -n0);
	    nE += oneOverTau*(one9thRho*(coef1*(u.x)  +coef2*u.x*u.x +oneMinusLastTerm) -nE);
	    nW += oneOverTau*(one9thRho*(coef1*(-u.x) +coef2*u.x*u.x +oneMinusLastTerm) -nW);
	    nN += oneOverTau*(one9thRho*(coef1*(u.y)  +coef2*u.y*u.y +oneMinusLastTerm) -nN);
	    nS += oneOverTau*(one9thRho*(coef1*(-u.y) +coef2*u.y*u.y +oneMinusLastTerm) -nS);

	    float uxPlusuy  = u.x + u.y; // NE dot u
	    float uxMinusuy = u.x - u.y; // SE dot u
	    nNE += oneOverTau*(one36thRho*(coef1*uxPlusuy     +coef2*uxPlusuy*uxPlusuy   +oneMinusLastTerm) -nNE);
	    nSE += oneOverTau*(one36thRho*(coef1*uxMinusuy    +coef2*uxMinusuy*uxMinusuy +oneMinusLastTerm) -nSE);
	    nNW += oneOverTau*(one36thRho*(coef1*(-uxMinusuy) +coef2*uxMinusuy*uxMinusuy +oneMinusLastTerm) -nNW);
	    nSW += oneOverTau*(one36thRho*(coef1*(-uxPlusuy)  +coef2*uxPlusuy*uxPlusuy   +oneMinusLastTerm) -nSW);
	}

    out_n_s_e_w      = vec4(nN,  nS,  nE,  nW);
    out_ne_se_nw_sw  = vec4(nNE, nSE, nNW, nSW);
    out_n0_rho_ux_uy = vec4(n0,  rho, u.x,  u.y);
}