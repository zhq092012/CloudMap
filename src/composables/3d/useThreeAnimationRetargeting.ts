import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export type LoadedGLTF = {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

export type RetargetedSource = {
  clip: THREE.AnimationClip;
  skeleton: THREE.Skeleton;
  mixer: THREE.AnimationMixer;
};
// RetargetedSource 是一个类型定义，表示一个已经准备好进行动画重定向的源模型。它包含了三个属性：clip 是一个 THREE.AnimationClip 对象，表示源模型的动画剪辑；skeleton 是一个 THREE.Skeleton 对象，表示源模型的骨骼结构；mixer 是一个 THREE.AnimationMixer 对象，用于播放和控制源模型的动画。这些属性共同构成了一个完整的动画重定向源，可以被用来将动画应用到目标模型上。
type MixamoRetargetOptions = {
  hip: string; // hip 属性指定了源模型中代表骨盆的骨骼名称。在 Mixamo 模型中，通常使用 "mixamorigHips" 作为骨盆骨骼的名称。这个属性对于动画重定向非常重要，因为骨盆通常是整个骨骼结构的根节点，动画重定向过程中需要确保骨盆的位置和旋转正确地映射到目标模型上。

  scale: number; // scale 属性指定了目标模型的缩放因子，用于调整动画的比例。

  localOffsets: Record<string, THREE.Matrix4>; // localOffsets 属性是一个字典，键是骨骼名称，值是对应的局部偏移矩阵。这个属性用于在动画重定向过程中对特定骨骼应用额外的旋转或平移，以确保动画在目标模型上正确地表现。
  
  names: Record<string, string>; // names 属性是一个字典，键是源模型的骨骼名称，值是目标模型的骨骼名称。这个属性用于在动画重定向过程中将源模型的骨骼映射到目标模型的骨骼。
};

export async function loadRetargetingPair(loader: GLTFLoader, sourceUrl: string, targetUrl: string): Promise<[LoadedGLTF, LoadedGLTF]> {
  return Promise.all([loader.loadAsync(sourceUrl), loader.loadAsync(targetUrl)]) as Promise<[LoadedGLTF, LoadedGLTF]>;
}

export function createRetargetedSource(sourceModel: LoadedGLTF, helpers: THREE.Group): RetargetedSource {
  const clip = sourceModel.animations[0];
  if (!clip) {
    throw new Error("Source model does not provide any animation clips.");
  }

  const helper = new THREE.SkeletonHelper(sourceModel.scene); //SkeletonHelper 是 three.js 提供的一个工具类，用于可视化骨骼结构。它会创建一个线框网格，显示骨骼之间的连接关系，帮助开发者理解和调试骨骼动画。
  helpers.add(helper); //将 SkeletonHelper 添加到 helpers 组中，这样它就会在场景中显示出来，帮助我们看到源模型的骨骼结构。
  const skeleton = new THREE.Skeleton(helper.bones); //从 SkeletonHelper 中获取骨骼数组，并创建一个 THREE.Skeleton 对象。这个对象包含了骨骼的层级关系和绑定信息，是后续动画重定向的基础。
  const mixer = new THREE.AnimationMixer(sourceModel.scene); //创建一个 AnimationMixer，用于播放动画。它需要一个 THREE.Object3D 作为参数，这里我们传入 sourceModel.scene，因为动画是作用在整个模型上的。
  mixer.clipAction(clip).play();

  return { clip, skeleton, mixer };
}
/**
 * 在给定的根对象下查找第一个 SkinnedMesh。
 * @param root - 根对象，通常是加载的模型的场景。
 * @returns 返回找到的第一个 SkinnedMesh 对象。
 * @throws 如果在根对象下未找到 SkinnedMesh，则抛出错误。
 */
export function findFirstSkinnedMesh(root: THREE.Object3D): THREE.SkinnedMesh {
  let skinnedMesh: THREE.SkinnedMesh | null = null;
  // 使用 traverse 方法遍历根对象及其所有子对象，寻找第一个 SkinnedMesh。traverse 方法会递归地访问每个子对象，并执行提供的回调函数。在回调函数中，我们检查当前对象是否是 SkinnedMesh，如果是，则将其赋值给 skinnedMesh 变量，并停止继续查找。
  root.traverse((object) => {
    if (skinnedMesh) return;

    if ((object as THREE.SkinnedMesh).isSkinnedMesh) {
      skinnedMesh = object as THREE.SkinnedMesh;
    }
  });

  if (!skinnedMesh) {
    throw new Error(`No skinned mesh found under ${root.name || "the loaded model"}.`);
  }

  return skinnedMesh;
}
/**
 * 创建一个适用于 Mixamo 模型的动画重定向选项对象。这个函数定义了一套针对 Mixamo 骨骼结构的特定调整，包括骨骼名称映射和局部偏移矩阵，以确保动画能够正确地应用到目标模型上。
 * @param targetScale - 目标模型的缩放因子，用于调整动画的比例。
 * @returns 返回一个 MixamoRetargetOptions 对象，包含骨骼名称映射和局部偏移矩阵。
 */

export function createMixamoRetargetOptions(targetScale: number): MixamoRetargetOptions {
  // 定义了一些旋转矩阵，用于调整 Mixamo 模型的骨骼方向。这些矩阵将被应用到特定的骨骼上，以确保动画在目标模型上正确地表现出来。rotateCW45 是一个绕 Y 轴顺时针旋转 45 度的矩阵，rotateCCW180 是一个绕 Y 轴逆时针旋转 180 度的矩阵，rotateCW180 是一个绕 Y 轴顺时针旋转 180 度的矩阵，rotateFoot 是一个根据欧拉角创建的旋转矩阵，用于调整脚部骨骼的方向。
  const rotateCW45 = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(45));
  const rotateCCW180 = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-180));
  const rotateCW180 = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(180));
  const rotateFoot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(45), THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(0)));

  return {
    hip: "mixamorigHips",
    scale: targetScale,
    localOffsets: {
      mixamorigLeftShoulder: rotateCW45,
      mixamorigRightShoulder: rotateCCW180,
      mixamorigLeftArm: rotateCW45,
      mixamorigRightArm: rotateCCW180,
      mixamorigLeftForeArm: rotateCW45,
      mixamorigRightForeArm: rotateCCW180,
      mixamorigLeftHand: rotateCW45,
      mixamorigRightHand: rotateCCW180,
      mixamorigLeftUpLeg: rotateCW180,
      mixamorigRightUpLeg: rotateCW180,
      mixamorigLeftLeg: rotateCW180,
      mixamorigRightLeg: rotateCW180,
      mixamorigLeftFoot: rotateFoot,
      mixamorigRightFoot: rotateFoot,
      mixamorigLeftToeBase: rotateCW180,
      mixamorigRightToeBase: rotateCW180,
    },
    names: {
      mixamorigHips: "mixamorigHips",
      mixamorigSpine: "mixamorigSpine",
      mixamorigSpine2: "mixamorigSpine2",
      mixamorigHead: "mixamorigHead",
      mixamorigLeftShoulder: "mixamorigLeftShoulder",
      mixamorigRightShoulder: "mixamorigRightShoulder",
      mixamorigLeftArm: "mixamorigLeftArm",
      mixamorigRightArm: "mixamorigRightArm",
      mixamorigLeftForeArm: "mixamorigLeftForeArm",
      mixamorigRightForeArm: "mixamorigRightForeArm",
      mixamorigLeftHand: "mixamorigLeftHand",
      mixamorigRightHand: "mixamorigRightHand",
      mixamorigLeftUpLeg: "mixamorigLeftUpLeg",
      mixamorigRightUpLeg: "mixamorigRightUpLeg",
      mixamorigLeftLeg: "mixamorigLeftLeg",
      mixamorigRightLeg: "mixamorigRightLeg",
      mixamorigLeftFoot: "mixamorigLeftFoot",
      mixamorigRightFoot: "mixamorigRightFoot",
      mixamorigLeftToeBase: "mixamorigLeftToeBase",
      mixamorigRightToeBase: "mixamorigRightToeBase",
    },
  };
}
/**
 * 创建一个动画混合器，用于将源模型的动画重定向到目标模型。
 * @param sourceModel - 源模型，包含骨骼和动画剪辑。
 * @param targetModel - 目标模型，动画将被重定向到该模型。
 * @param helperGroup - 可选的辅助组，用于显示骨骼辅助线。
 * @returns 返回一个 THREE.AnimationMixer 对象，用于播放重定向后的动画。
 */
export function createRetargetedMixer(sourceModel: RetargetedSource, targetModel: LoadedGLTF, helperGroup?: THREE.Group): THREE.AnimationMixer {
  const targetSkin = findFirstSkinnedMesh(targetModel.scene); //

  if (helperGroup) {
    helperGroup.add(new THREE.SkeletonHelper(targetModel.scene));//如果提供了 helperGroup，我们就创建一个新的 SkeletonHelper，并将其添加到 helperGroup 中，以便在场景中可视化目标模型的骨骼结构。这对于调试和验证动画重定向非常有帮助，因为它可以让我们看到目标模型的骨骼是否正确地匹配了源模型的骨骼。
  }

  // 计算缩放因子，确保动画在目标模型上以正确的比例播放。我们通过检查目标模型的场景缩放来确定这个因子，如果缩放的 y 分量非常接近于零，我们就使用一个默认值来避免除以零的情况。
  const scale = Math.abs(targetModel.scene.scale.y) > Number.EPSILON ? 1 / targetModel.scene.scale.y : 1;

  const retargetedClip = SkeletonUtils.retargetClip(targetSkin, sourceModel.skeleton, sourceModel.clip, createMixamoRetargetOptions(scale));

  const mixer = new THREE.AnimationMixer(targetSkin);
  mixer.clipAction(retargetedClip).play();

  return mixer;
}
