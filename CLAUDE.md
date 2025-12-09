# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Protocol Buffers (protoc) plugin written in C++ that generates JavaScript classes from `.proto` files. The plugin follows the "Option B" design described in `Protobuf生成JS方案.md`: it creates JavaScript classes with getter/setter methods that convert between camelCase (JavaScript) and snake_case (protobuf) naming conventions. The generated classes support fluent/chained method calls (each setter returns `this`) and can be directly serialized to JSON.

The plugin is built as a standalone executable that protoc invokes via the `--plugin` option. The generated code uses ES modules (`.mjs` files).

## Building the Plugin

The project uses CMake with a submodule dependency on the protobuf library. Build steps:

1. **Initialize submodules** (if not already done):
   ```bash
   git submodule update --init --recursive
   ```

2. **Configure with CMake**:
   ```bash
   mkdir build && cd build
   cmake ..
   ```

   On Windows with MSVC, you may need to specify the generator:
   ```bash
   cmake -G "Visual Studio 17 2022" ..
   ```

3. **Build**:
   ```bash
   cmake --build . --config Release
   ```

   The plugin executable will be placed at:
   - Windows: `build/bin/Release/protoc-gen-js-plugin.exe`
   - Unix: `build/bin/Release/protoc-gen-js-plugin`

   For Debug builds, replace `Release` with `Debug`.

## Testing the Plugin

A test suite is provided in the `test/` directory:

1. **Ensure protoc is installed** and available in your PATH.

2. **Build the plugin** (see above).

3. **Run the test generator**:
   ```bash
   node test/build.mjs
   ```

   This script:
   - Scans `test/proto/` for all `.proto` files
   - Invokes `protoc` with the built plugin
   - Generates JavaScript modules in `test/dist/`

4. **View the streaming example**:
   ```bash
   node test/streaming-example.mjs
   ```

   This demonstrates usage of the generated classes with fluent method chaining.

## Architecture

The plugin follows the standard protoc plugin interface:

- **Entry point**: `src/main.cc` reads a `CodeGeneratorRequest` from stdin, processes it via `RequestProcessor`, and writes a `CodeGeneratorResponse` to stdout.
- **RequestProcessor** (`include/request_processor.h`, `src/request_processor.cc`): Coordinates generation for each proto file in the request.
- **JsCodeGenerator** (`include/js_code_generator.h`, `src/js_code_generator.cc`): Generates JavaScript code for a single `.proto` file. Handles imports, type transformations, and method generation.
- **TypeResolver** (`include/type_resolver.h`, `src/type_resolver.cc`): Resolves cross‑file type references and manages import dependencies.
- **TypeHelper** (`include/type_helper.h`, `src/type_helper.cc`): Utilities for mapping protobuf types to JavaScript types.
- **StringExtensions** (`include/string_extensions.h`, `src/string_extensions.cc`): String manipulation helpers (e.g., snake_case ↔ camelCase).

### Key Design Decisions

- **Getter/setter methods**: Each protobuf field generates a `getFieldName()` and `setFieldName(value)` method. Setters return `this` to enable fluent chaining.
- **Import aliasing**: To avoid naming conflicts, imported types are given aliases based on their proto file path (e.g., `import { Vector3 as __core_math_Vector3 } from './core/math.mjs'`).
- **Nested messages**: Nested messages are generated as separate classes attached to the parent class (e.g., `OuterClass.InnerClass`).
- **Enums**: Generated as plain JavaScript objects with numeric values.

## Directory Structure

- `src/` – C++ source files
- `include/` – C++ header files
- `test/` – Test proto files and build scripts
  - `test/proto/` – Sample `.proto` files (including a nested `pokeworld/` hierarchy)
  - `test/build.mjs` – Node.js script that runs protoc with the plugin
  - `test/streaming-example.mjs` – Demo of using the generated classes
  - `test/dist/` – Generated JavaScript output (git‑ignored)
- `third-party/` – Git submodule for protobuf (`third-party/protobuf`)
- `build/` – CMake build directory (git‑ignored)

## Common Development Tasks

### Adding a New Field Type

1. Update `type_helper.cc` to map the protobuf type to the appropriate JavaScript type.
2. Update `js_code_generator.cc`'s `GenerateFieldMethods` to emit the correct getter/setter signature.
3. Rebuild the plugin and run the test suite.

### Debugging the Plugin

The plugin writes log messages to stderr (visible when protoc is run with `--verbose`). You can also build a Debug configuration and attach a debugger to the plugin process.

### Integrating with a Larger Project

To use the plugin in another project:

1. Build the plugin as described above.
2. Invoke protoc with:
   ```bash
   protoc --plugin=protoc-gen-js-mjs=path/to/protoc-gen-js-plugin \
          --js-mjs_out=output/dir \
          -I proto/dir \
          your/proto/files/*.proto
   ```

   The `--js-mjs_out` flag tells protoc to use the plugin for files with the `.mjs` extension.

## Dependencies

- **Protobuf**: Included as a git submodule. The CMake configuration links against `protobuf::libprotobuf`, `protobuf::libprotobuf-lite`, and `protobuf::libprotoc`.
- **C++20**: The code uses C++20 features (e.g., `std::string_view`, ranges).

## Notes

- The plugin currently only supports proto3 syntax.
- Map types are not fully typed in the generated JavaScript (they appear as `any`).
- The plugin is designed for Node.js/ES module environments; no CommonJS version is generated.

Refer to `Protobuf生成JS方案.md` (in Chinese) for the design rationale and trade‑offs between different generation strategies.