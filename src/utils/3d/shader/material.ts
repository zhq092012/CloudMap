import * as THREE from "three";
import type { UniformMap } from "./uniforms";

export interface ShaderMaterialOptions {
  vertexShader: string;
  fragmentShader: string;
  uniforms?: UniformMap;
  transparent?: boolean;
  side?: THREE.Side;
  glslVersion?: THREE.GLSLVersion;
}

/**
 * 创建 RawShaderMaterial。
 *
 * 适用于你希望完全控制 shader 输入输出（不依赖 Three 注入宏）的场景。
 */
export function createRawShaderMaterial(options: ShaderMaterialOptions): THREE.RawShaderMaterial {
  return new THREE.RawShaderMaterial({
    vertexShader: options.vertexShader,
    fragmentShader: options.fragmentShader,
    uniforms: options.uniforms,
    transparent: options.transparent ?? false,
    side: options.side ?? THREE.DoubleSide,
    glslVersion: options.glslVersion ?? THREE.GLSL3,
  });
}

/**
 * 创建 ShaderMaterial。
 *
 * 适用于你想继续享受 Three 注入变量（如部分内建 uniform/define）的场景。
 */
export function createShaderMaterial(options: ShaderMaterialOptions): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: options.vertexShader,
    fragmentShader: options.fragmentShader,
    uniforms: options.uniforms,
    transparent: options.transparent ?? false,
    side: options.side ?? THREE.DoubleSide,
    glslVersion: options.glslVersion ?? THREE.GLSL3,
  });
}
