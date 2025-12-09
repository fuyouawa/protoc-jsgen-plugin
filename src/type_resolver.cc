#include "type_resolver.h"

#include <algorithm>
#include <memory>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

namespace protoc_js_gen_plugin {

namespace {

using google::protobuf::DescriptorProto;
using google::protobuf::EnumDescriptorProto;
using google::protobuf::FileDescriptorProto;

// Hash function for std::pair<std::string, std::string>
struct PairHash {
    std::size_t operator()(const std::pair<std::string, std::string>& p) const noexcept {
        std::size_t h1 = std::hash<std::string>{}(p.first);
        std::size_t h2 = std::hash<std::string>{}(p.second);
        // Combine hashes (from boost::hash_combine)
        return h1 ^ (h2 + 0x9e3779b9 + (h1 << 6) + (h1 >> 2));
    }
};

// Equality function for std::pair<std::string, std::string>
struct PairEqual {
    bool operator()(const std::pair<std::string, std::string>& a,
                    const std::pair<std::string, std::string>& b) const noexcept {
        return a.first == b.first && a.second == b.second;
    }
};

}  // namespace

TypeResolver::TypeResolver(
    const FileDescriptorProto& current_file,
    const std::vector<const FileDescriptorProto*>& all_proto_files)
    : current_file_(current_file),
      all_proto_files_(all_proto_files) {
    BuildTypeMap();
}

void TypeResolver::BuildTypeMap() {
    for (const FileDescriptorProto* proto_file : all_proto_files_) {
        // Process message types
        for (const DescriptorProto& message : proto_file->message_type()) {
            RegisterMessage(message, *proto_file);
        }

        // Process enum types
        for (const EnumDescriptorProto& enum_type : proto_file->enum_type()) {
            RegisterEnum(enum_type, *proto_file);
        }
    }
}

void TypeResolver::RegisterMessage(
    const DescriptorProto& message,
    const FileDescriptorProto& proto_file,
    const std::string& parent_full_name) {

    std::string full_name = GetFullName(message.name(), proto_file.package(), parent_full_name);
    type_map_[full_name] = std::make_pair(proto_file.name(), message.name());

    // Recursively process nested messages
    for (const DescriptorProto& nested_message : message.nested_type()) {
        RegisterMessage(nested_message, proto_file, full_name);
    }

    // Process nested enums
    for (const EnumDescriptorProto& nested_enum : message.enum_type()) {
        RegisterEnum(nested_enum, proto_file, full_name);
    }
}

void TypeResolver::RegisterEnum(
    const EnumDescriptorProto& enum_type,
    const FileDescriptorProto& proto_file,
    const std::string& parent_full_name) {

    std::string full_name = GetFullName(enum_type.name(), proto_file.package(), parent_full_name);
    type_map_[full_name] = std::make_pair(proto_file.name(), enum_type.name());
}

std::string TypeResolver::GetFullName(
    const std::string& name,
    const std::string& package,
    const std::string& parent_full_name) {

    // Build full type name (starting with dot)
    if (!parent_full_name.empty()) {
        return parent_full_name + "." + name;
    } else if (!package.empty()) {
        return "." + package + "." + name;
    } else {
        return "." + name;
    }
}

std::unique_ptr<TypeResolver::TypeInfo> TypeResolver::GetExternalTypeInfo(
    const std::string& type_name) const {

    // Normalize type name: ensure it starts with dot
    std::string normalized_name = type_name;
    if (normalized_name.empty() || normalized_name[0] != '.') {
        normalized_name = "." + normalized_name;
    }

    auto it = type_map_.find(normalized_name);
    if (it != type_map_.end()) {
        const TypeInfo& info = it->second;

        // Check if it's from the current file
        if (info.first == current_file_.name()) {
            return nullptr;
        }

        return std::make_unique<TypeInfo>(info);
    }

    // Type not found (could be a basic type or error)
    return nullptr;
}

std::vector<TypeResolver::TypeInfo> TypeResolver::GetRequiredImports(
    const std::vector<std::string>& referenced_type_names) const {

    std::unordered_set<TypeInfo, PairHash, PairEqual> imports;

    for (const std::string& type_name : referenced_type_names) {
        auto info = GetExternalTypeInfo(type_name);
        if (info) {
            imports.insert(*info);
        }
    }

    return std::vector<TypeInfo>(imports.begin(), imports.end());
}

}  // namespace protoc_js_gen_plugin