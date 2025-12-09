#pragma once

#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "google/protobuf/descriptor.pb.h"

namespace protoc_js_gen_plugin {

class TypeResolver {
public:
    using TypeInfo = std::pair<std::string, std::string>;  // (proto_file, simple_name)

    TypeResolver(
        const google::protobuf::FileDescriptorProto& current_file,
        const std::vector<const google::protobuf::FileDescriptorProto*>& all_proto_files);

    // Get type information for external types
    // Returns (proto_file, simple_name) if external, nullptr otherwise
    std::unique_ptr<TypeInfo> GetExternalTypeInfo(const std::string& type_name) const;

    // Get required imports for referenced types
    std::vector<TypeInfo> GetRequiredImports(
        const std::vector<std::string>& referenced_type_names) const;

private:
    void BuildTypeMap();
    void RegisterMessage(
        const google::protobuf::DescriptorProto& message,
        const google::protobuf::FileDescriptorProto& proto_file,
        const std::string& parent_full_name = "");
    void RegisterEnum(
        const google::protobuf::EnumDescriptorProto& enum_type,
        const google::protobuf::FileDescriptorProto& proto_file,
        const std::string& parent_full_name = "");
    static std::string GetFullName(
        const std::string& name,
        const std::string& package,
        const std::string& parent_full_name);

    std::unordered_map<std::string, TypeInfo> type_map_;
    const google::protobuf::FileDescriptorProto& current_file_;
    std::vector<const google::protobuf::FileDescriptorProto*> all_proto_files_;
};

}  // namespace protoc_js_gen_plugin