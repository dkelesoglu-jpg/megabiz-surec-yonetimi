import java.util.Base64
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Uygulama adı ve paket kimliği tek kaynaktan gelir: identity/AppIdentity.xcconfig
val identity = Properties().apply {
    file("../../identity/AppIdentity.xcconfig").inputStream().use { load(it) }
}
val appIdBase: String = identity.getProperty("APP_ID_BASE")
val appDisplayName: String = identity.getProperty("APP_DISPLAY_NAME")

// Ortam, `--dart-define-from-file=../env/<ortam>.json` içindeki APP_ENV'den okunur.
val dartDefines: Map<String, String> = (project.findProperty("dart-defines") as String?)
    ?.split(",")
    ?.map { String(Base64.getDecoder().decode(it)) }
    ?.mapNotNull { entry -> entry.split("=", limit = 2).takeIf { it.size == 2 }?.let { it[0] to it[1] } }
    ?.toMap()
    ?: emptyMap()
val appEnv: String = dartDefines["APP_ENV"] ?: "dev"
val isProd = appEnv == "prod"

// Yükleme (upload) anahtarı: android/key.properties — git'e girmez.
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) keystorePropertiesFile.inputStream().use { load(it) }
}

if (isProd) {
    if (appIdBase.contains("placeholder")) {
        throw GradleException("prod derlemesi geçici paket kimliğiyle yapılamaz: identity/AppIdentity.xcconfig")
    }
    if (!keystorePropertiesFile.exists()) {
        throw GradleException("prod derlemesi için android/key.properties gerekli (yükleme anahtarı).")
    }
}

android {
    namespace = "com.globaltv.global_tv"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = if (isProd) appIdBase else "$appIdBase.$appEnv"
        manifestPlaceholders["appLabel"] = when (appEnv) {
            "prod" -> appDisplayName
            "staging" -> "$appDisplayName BETA"
            else -> "$appDisplayName ${appEnv.uppercase()}"
        }
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            // Anahtar yoksa (dev/staging test APK'ları) hata ayıklama anahtarıyla imzalanır.
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
