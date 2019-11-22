cmake_minimum_required(VERSION 3.9)

# project settings

project(serial CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# sources

set(serial_source_dir src)
set(protocol_source_dir ../protocol/src/protocol)
set(serial_include_dir include)
set(protocol_include_dir ../protocol/include)
set(base_include_dir include/serial)
set(generated_header_dir ${CMAKE_BINARY_DIR}/generated)

set(export_header
    ${generated_header_dir}/serial_export.hpp)

set(public_headers
    ${serial_include_dir}/libInterface.hpp
    ${export_header})

set(private_headers
    ${serial_include_dir}/serial.hpp
    ${protocol_include_dir}/protocol/protocol.hpp
    ${protocol_include_dir}/protocol/header.hpp
    ${protocol_include_dir}/protocol/messageType.hpp)

if (WIN32)
set(sources
    ${serial_source_dir}/cppLib/lib.cpp
    ${serial_source_dir}/serial/shared.cpp
    ${serial_source_dir}/serial/win.cpp
    ${protocol_source_dir}/protocol.cpp)
elseif (UNIX)
set(sources
    ${serial_source_dir}/cppLib/lib.cpp
    ${serial_source_dir}/serial/shared.cpp
    ${serial_source_dir}/serial/unix.cpp
    ${protocol_source_dir}/protocol.cpp)
else()
    message(FATAL_ERROR "System is neither WIN32 nor UNIX.")
endif()

# lib target

include_directories(${generated_header_dir})
include_directories(${serial_include_dir})
include_directories(${protocol_include_dir})
add_compile_definitions(SKIP_ANALYZER)
add_library(serial SHARED ${public_headers} ${private_headers} ${sources})

include(GenerateExportHeader)
generate_export_header(serial
    BASE_NAME serial
    EXPORT_MACRO_NAME SERIAL_EXPORT
    EXPORT_FILE_NAME ${export_header}
    STATIC_DEFINE SERIAL_BUILT_AS_STATIC)

# install settings

set_target_properties(serial PROPERTIES PUBLIC_HEADER "${public_headers}")

if(APPLE)
set_target_properties(serial PROPERTIES SUFFIX ".bundle")
elseif(WIN32)
set_target_properties(serial PROPERTIES SUFFIX ".dll")
endif()

include(GNUInstallDirs)
install(TARGETS serial
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_LIBDIR}
    PUBLIC_HEADER DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

add_executable(standalone.out ${serial_source_dir}/standalone/standalone.cpp
${serial_source_dir}/standalone/main.cpp
${serial_include_dir}/standalone.hpp
${serial_include_dir}/serial.hpp
)