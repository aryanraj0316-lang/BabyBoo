const fs = require('fs');
const path = require('path');

// 1. Patch expo-constants get-app-config-android.gradle
try {
  const targetFile = path.resolve(__dirname, '../node_modules/expo-constants/scripts/get-app-config-android.gradle');
  if (fs.existsSync(targetFile)) {
    const content = fs.readFileSync(targetFile, 'utf8');
    if (!content.includes("project.android.hasProperty('libraryVariants')")) {
      const patched = `// Gradle script for generating serialized public app config (from app.config.js/ts or app.json) and bundling it into the APK

import org.apache.tools.ant.taskdefs.condition.Os


def expoConstantsDir = project.providers.exec {
  workingDir(projectDir)
  commandLine("node", "-e", "console.log(require('path').dirname(require.resolve('expo-constants/package.json')));")
}.standardOutput.asText.get().trim()

def config = project.hasProperty("react") ? project.react : [];
def nodeExecutableAndArgs = config.nodeExecutableAndArgs ?: ["node"]

afterEvaluate {
  def expoGradleExtension = gradle.extensions.findByName("expoGradle")
  def customProjectRoot = expoGradleExtension?.projectRoot
  def projectRoot = file("\${customProjectRoot ?: rootProject.projectDir}")

  if (project.android.hasProperty('libraryVariants')) {
    project.android.libraryVariants.all { variant ->
      def assetsDir = file("\$buildDir/generated/assets/expo-constants/\${variant.name}")
      def configMode = variant.buildType.name == "debug" || variant.buildType.name == "debugOptimized" ? "development" : "production"

      def createConfigTask = tasks.register("create\${variant.name.capitalize()}ExpoConfig", Exec) {
        description = 'expo-constants: Create app.config.'

        doFirst {
          assetsDir.deleteDir()
          assetsDir.mkdirs()
        }

        outputs.upToDateWhen { false }
        outputs.dir assetsDir
        workingDir projectRoot

        if (Os.isFamily(Os.FAMILY_WINDOWS)) {
          commandLine("cmd", "/c", *nodeExecutableAndArgs, "\$expoConstantsDir/scripts/getAppConfig.js", projectRoot, assetsDir, "android", "false", configMode)
        } else {
          commandLine(*nodeExecutableAndArgs, "\$expoConstantsDir/scripts/getAppConfig.js", projectRoot, assetsDir, "android", "false", configMode)
        }
      }

      variant.preBuildProvider.configure { it.dependsOn(createConfigTask) }
      project.android.sourceSets.maybeCreate(variant.name).assets.srcDirs += assetsDir
    }
  } else {
    def assetsDir = file("\$buildDir/generated/assets/expo-constants/main")
    def createConfigTask = tasks.register("createMainExpoConfig", Exec) {
      description = 'expo-constants: Create app.config.'
      doFirst {
        assetsDir.deleteDir()
        assetsDir.mkdirs()
      }
      outputs.upToDateWhen { false }
      outputs.dir assetsDir
      workingDir projectRoot
      if (Os.isFamily(Os.FAMILY_WINDOWS)) {
        commandLine("cmd", "/c", *nodeExecutableAndArgs, "\$expoConstantsDir/scripts/getAppConfig.js", projectRoot, assetsDir, "android", "false", "production")
      } else {
        commandLine(*nodeExecutableAndArgs, "\$expoConstantsDir/scripts/getAppConfig.js", projectRoot, assetsDir, "android", "false", "production")
      }
    }
    tasks.named("preBuild").configure { it.dependsOn(createConfigTask) }
    project.android.sourceSets.maybeCreate("main").assets.srcDirs += assetsDir
  }

  def fingerprintAssetsDir = file("\$buildDir/generated/assets/expo-constants-fingerprint")

  def createFingerprintTask = tasks.register('createExpoFingerprint', Exec) {
    description = 'expo-constants: Embed the project fingerprint (app.fingerprint) in debug builds.'

    doFirst {
      fingerprintAssetsDir.deleteDir()
      fingerprintAssetsDir.mkdirs()
    }

    outputs.upToDateWhen { false }
    outputs.dir fingerprintAssetsDir
    workingDir projectRoot

    if (Os.isFamily(Os.FAMILY_WINDOWS)) {
      commandLine("cmd", "/c", *nodeExecutableAndArgs, "\$expoConstantsDir/scripts/createFingerprintFile.js", projectRoot, fingerprintAssetsDir, "android")
    } else {
      commandLine(*nodeExecutableAndArgs, "\$expoConstantsDir/scripts/createFingerprintFile.js", projectRoot, fingerprintAssetsDir, "android")
    }
  }

  if (project.android.hasProperty('libraryVariants')) {
    project.android.libraryVariants.all { variant ->
      if (!variant.buildType.debuggable) {
        return
      }
      variant.preBuildProvider.configure { it.dependsOn(createFingerprintTask) }
      project.android.sourceSets.maybeCreate(variant.buildType.name).assets.srcDirs += fingerprintAssetsDir
    }
  } else {
    tasks.named("preBuild").configure { it.dependsOn(createFingerprintTask) }
    project.android.sourceSets.maybeCreate("debug").assets.srcDirs += fingerprintAssetsDir
  }
}
`;
      fs.writeFileSync(targetFile, patched, 'utf8');
      console.log('[patch] Successfully patched expo-constants get-app-config-android.gradle for AGP 9.');
    }
  }
} catch (e) {
  console.warn('[patch] Warning patching expo-constants:', e.message);
}

// 2. Patch expo-modules-core android/build.gradle (ndkDirectory for AGP 9)
try {
  const possibleCoreFiles = [
    path.resolve(__dirname, '../node_modules/expo/node_modules/expo-modules-core/android/build.gradle'),
    path.resolve(__dirname, '../node_modules/expo-modules-core/android/build.gradle')
  ];

  for (const coreFile of possibleCoreFiles) {
    if (fs.existsSync(coreFile)) {
      let content = fs.readFileSync(coreFile, 'utf8');
      if (content.includes('android.ndkDirectory')) {
        content = content.replace(
          'PrebuiltNativeLibs.findLlvmStrip(android.ndkDirectory)',
          "PrebuiltNativeLibs.findLlvmStrip(android.hasProperty('ndkDirectory') ? android.ndkDirectory : (System.getenv('ANDROID_NDK_HOME') ? file(System.getenv('ANDROID_NDK_HOME')) : null))"
        );
        fs.writeFileSync(coreFile, content, 'utf8');
        console.log('[patch] Successfully patched expo-modules-core android.ndkDirectory for AGP 9 at ' + coreFile);
      }
    }
  }
} catch (e) {
  console.warn('[patch] Warning patching expo-modules-core:', e.message);
}

// 3. Patch expo-updates android/build.gradle (KSP version for Kotlin 2.2.x)
try {
  const expoUpdatesFile = path.resolve(__dirname, '../node_modules/expo-updates/android/build.gradle');
  if (fs.existsSync(expoUpdatesFile)) {
    let content = fs.readFileSync(expoUpdatesFile, 'utf8');
    if (!content.includes('"2.2.10-2.0.2"')) {
      content = content.replace(
        /if \(kotlinVersion == "2\.2\.0"\) \{[\s\S]*?\} else if \(kotlinVersion == "2\.1\.20"\) \{/,
        'if (kotlinVersion == "2.2.10" || kotlinVersion?.startsWith("2.2.10")) {\n        return "2.2.10-2.0.2"\n      } else if (kotlinVersion == "2.2.0") {\n        return "2.2.0-2.0.2"\n      } else if (kotlinVersion == "2.1.20") {'
      );
      if (!content.includes('"2.2.10-2.0.2"')) {
        content = content.replace(
          'if (kotlinVersion == "2.1.20") {',
          'if (kotlinVersion == "2.2.10" || kotlinVersion?.startsWith("2.2.10")) {\n        return "2.2.10-2.0.2"\n      } else if (kotlinVersion == "2.2.0") {\n        return "2.2.0-2.0.2"\n      } else if (kotlinVersion == "2.1.20") {'
        );
      }
      fs.writeFileSync(expoUpdatesFile, content, 'utf8');
      console.log('[patch] Successfully patched expo-updates/android/build.gradle for KSP 2.2.10-2.0.2');
    }
  }
} catch (e) {
  console.warn('[patch] Warning patching expo-updates:', e.message);
}


