#pragma once

#include <string>

namespace protoc_js_gen_plugin {

// Converts snake_case to camelCase
std::string SnakeToCamelCase(const std::string& snake_case);

// Converts snake_case to PascalCase
std::string SnakeToPascalCase(const std::string& snake_case);

}  // namespace protoc_js_gen_plugin