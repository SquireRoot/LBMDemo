#version 300 es

precision highp float;
precision highp int;

in vec2 pixPos;

uniform sampler2D in_n_s_e_w;
uniform sampler2D in_ne_se_nw_sw;
uniform sampler2D in_n0_rho_ux_uy;
uniform sampler2D domain;

layout (location = 0) out vec4 out_n_s_e_w;
layout (location = 1) out vec4 out_ne_se_nw_sw;
layout (location = 2) out vec4 out_n0_rho_ux_uy;

#define isFluid(pos)  (texture(domain, pixPos).r > 0.5)

void main() {
	vec2 size = vec2(textureSize(in_n_s_e_w, 0));

	vec2 i = vec2(1.0, 0.0)/size;
	vec2 j = vec2(0.0, 1.0)/size;

  	vec4 n_s_e_w      = texture(in_n_s_e_w,      pixPos);
    vec4 ne_se_nw_sw  = texture(in_ne_se_nw_sw,  pixPos);
    vec4 n0_rho_ux_uy = texture(in_n0_rho_ux_uy, pixPos);

    float nN  = n_s_e_w.r ;
    float nS  = n_s_e_w.g ;
    float nE  = n_s_e_w.b ;
    float nW  = n_s_e_w.a ;
    float nNE = ne_se_nw_sw.r ;
    float nSE = ne_se_nw_sw.g ;
    float nNW = ne_se_nw_sw.b ;
    float nSW = ne_se_nw_sw.a ;
    float n0  = n0_rho_ux_uy.r ;

    if (isFluid(pixPos)) {
	    nN  = isFluid(pixPos-j) ? 
	        texture(in_n_s_e_w, pixPos-j).r:
	        texture(in_n_s_e_w, pixPos).g;

	    nS  = isFluid(pixPos+j) ?
	        texture(in_n_s_e_w, pixPos+j).g: 
	        texture(in_n_s_e_w, pixPos).r; 

	    nE  = isFluid(pixPos-i) ?
	        texture(in_n_s_e_w, pixPos-i).b: 
	        texture(in_n_s_e_w, pixPos).a;
	    
	    nW  = isFluid(pixPos+i) ?
	        texture(in_n_s_e_w, pixPos+i).a: 
	        texture(in_n_s_e_w, pixPos).b;

	    nNE = isFluid(pixPos-i-j) ? 
	        texture(in_ne_se_nw_sw, pixPos-i-j).r:
	        texture(in_ne_se_nw_sw, pixPos).a;

	    nSE = isFluid(pixPos-i+j) ?
	        texture(in_ne_se_nw_sw, pixPos-i+j).g:
	        texture(in_ne_se_nw_sw, pixPos).b;
	        
	    nNW = isFluid(pixPos+i-j) ?
	        texture(in_ne_se_nw_sw, pixPos+i-j).b:
	        texture(in_ne_se_nw_sw, pixPos).g;

	    nSW = isFluid(pixPos+i+j) ? 
	        texture(in_ne_se_nw_sw, pixPos+i+j).a:
	        texture(in_ne_se_nw_sw, pixPos).r;

	    // if (pixPos.x < i.x) {
	    // 	vec2 samplePoint = vec2(1.0, pixPos.y);
	    // 	nE = texture(in_n_s_e_w, samplePoint).b;
	    // 	nNE = texture(in_ne_se_nw_sw, samplePoint).r;
	    // 	nSE = texture(in_ne_se_nw_sw, samplePoint).g;
	    // } else if (pixPos.y > 1.0-i.x) {
	    // 	vec2 samplePoint = vec2(0.0, pixPos.y);
	    // 	nW = texture(in_n_s_e_w, samplePoint).a;
	    // 	nNW = texture(in_ne_se_nw_sw, samplePoint).b;
	    // 	nSW = texture(in_ne_se_nw_sw, samplePoint).a;
	    // } 
	}

    float rho = n0 + nN + nS + nE + nW + nNW + nNE + nSW + nSE ;
    float ux = (nE + nNE + nSE - nW - nNW - nSW) / rho;
    float uy = (nN + nNE + nNW - nS - nSE - nSW) / rho;
 
    out_n_s_e_w      = vec4(nN,  nS,  nE,  nW);
    out_ne_se_nw_sw  = vec4(nNE, nSE, nNW, nSW);
    out_n0_rho_ux_uy = vec4(n0,  rho, ux,  uy);
}