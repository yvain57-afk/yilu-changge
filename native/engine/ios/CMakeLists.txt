cmake_minimum_required(VERSION 3.8)

set(CMAKE_SYSTEM_NAME iOS)
set(CMAKE_OSX_SYSROOT "iphoneos" CACHE STRING "Explicit iOS SDK; old CMake defaults to macOS with Xcode 27" FORCE)
set(APP_NAME "一路长歌"  CACHE STRING "Project Name")

project(${APP_NAME} CXX)

set(CC_PROJECT_DIR ${CMAKE_CURRENT_LIST_DIR})
set(CC_UI_RESOURCES)
set(CC_PROJ_SOURCES)
set(CC_ASSET_FILES)
set(CC_COMMON_SOURCES)
set(CC_ALL_SOURCES)

include(${CC_PROJECT_DIR}/../common/CMakeLists.txt)
set(EXECUTABLE_NAME ${APP_NAME}-mobile)

cc_ios_before_target(${EXECUTABLE_NAME})
add_executable(${EXECUTABLE_NAME} ${CC_ALL_SOURCES})
cc_ios_after_target(${EXECUTABLE_NAME})

# Required-reason APIs in the statically linked engine belong to the app bundle.
set(CC_PRIVACY_MANIFEST "${CC_PROJECT_DIR}/PrivacyInfo.xcprivacy")
target_sources(${EXECUTABLE_NAME} PRIVATE "${CC_PRIVACY_MANIFEST}")
set_source_files_properties("${CC_PRIVACY_MANIFEST}" PROPERTIES
    MACOSX_PACKAGE_LOCATION Resources)
