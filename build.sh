npx tsc --module commonjs --outDir cjs/ &
npx tsc --module es2022 --outDir esm/ &

wait

echo '{"type": "commonjs"}' > cjs/package.json &
npx copyfiles -u 1 "src/**/*.d.ts" cjs &

echo '{"type": "module"}' > esm/package.json &
npx copyfiles -u 1 "src/**/*.d.ts" esm &

# in esm add .js extension to all imports which contain slash
# find esm -name '*.js' -exec sed -i -E "s/(from ['\"][^'\"]+)(['\"])/\1.js\2/g" {} +

find esm -name '*.js' -exec sed -i -E "s/(from ['\"](\.\/|\.\.\/)[^'\"]+)(['\"])/\1.js\3/g" {} +


wait
