require 'json';


def build_tree(path)
  entries = Dir.children(path).sort
  dirs = {}
  files = []

  entries.each do |name|
    full = File.join(path, name)
    if File.directory?(full)
      dirs[name] = build_tree(full)
    elsif name.end_with?(".md")
      files << name
    end
  end

  {
    "directories" => dirs,
    "files" => files
  }
end


root = ARGV[0] || "static/files"
output_file = ARGV[1] || "static/files/index.json"
file_index = build_tree(root)
File.write(output_file, JSON.pretty_generate(file_index) + "\n")
