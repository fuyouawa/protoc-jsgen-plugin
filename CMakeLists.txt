cmake_minimum_required(VERSION 3.15)
project(protoc-gen-js-plugin LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug CACHE STRING "Build type" FORCE)
endif()

set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS "Debug" "Release" "RelWithDebInfo" "MinSizeRel")

message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")

if(MSVC)
    add_compile_options("/utf-8")
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
    add_compile_options(/W4)
endif()

set(THIRD_PARTY_DIR ${PROJECT_SOURCE_DIR}/third-party)

include_directories(${PROJECT_SOURCE_DIR}/include)
include_directories(${THIRD_PARTY_DIR}/protobuf/src)

add_subdirectory(${THIRD_PARTY_DIR}/protobuf)

file(GLOB_RECURSE SRC "src/*.cc")

add_executable(protoc-gen-js-plugin ${SRC})

set_target_properties(protoc-gen-js-plugin PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY_DEBUG   ${CMAKE_BINARY_DIR}/bin/Debug
    RUNTIME_OUTPUT_DIRECTORY_RELEASE ${CMAKE_BINARY_DIR}/bin/Release
)

target_link_libraries(protoc-gen-js-plugin PRIVATE
    protobuf::libprotobuf
    protobuf::libprotobuf-lite
    protobuf::libprotoc
)
