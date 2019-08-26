// Imports
import { readFileSync, writeFileSync, fstat, rename, renameSync } from "fs";
​const readdir = require("recursive-readdir");
const path = require('path')

// The files (recursive) in this directory will be parsed for keywords. The file names may also be replacecd depending on SHOULD_REPLACE_FILENAMES
const KEYWORDS_ROOT_DIRECTORY = "/Users/ivan_cheung/code/apps/ios/lib/AirbnbIdentity/AirbnbIdentity/ChinaIdentityVerification"
// The files (recursive) in this directory will have all the keywords identified in KEYWORDS_ROOT_DIRECTORY replaced. 
// It usually should be a parent directory of KEYWORDS_ROOT_DIRECTORY
// WARNING: There might be naming conflicts that need to be fixed manually
const RENAMING_ROOT_DIRECTORY = "/Users/ivan_cheung/code/apps/ios/"
const APPENDAGE = "Legacy2"
const IS_PREFIX = false
const IS_SWIFT = true
const FILE_EXTENSION = IS_SWIFT ? ".swift" : ".java"
const LANGUAGE_KEYWORDS = IS_SWIFT ? ["class", "enum", "struct", "protocol"] : ["class", "enum", "interface"]
const SHOULD_REPLACE_FILENAMES = true
​
async function run() {
	let files: string[] = await readdir(KEYWORDS_ROOT_DIRECTORY).filter((x: string) => x.endsWith(FILE_EXTENSION))
​
	// Find all classes, structs, enums and protocols
	let allTypesSet = files						
						.map((x: string) => FindTypes(x))
						.reduce((prev: Set<string>, current: Set<string>) => union(prev, current), new Set<string>())
						.values()

	let allTypes: string[] = Array.from(allTypesSet)
​
	console.log(`Found ${allTypes.length} types:`)
	console.log(allTypes.map(x => `\t${x}`).join("\n"))
​
	// Rename all text in files
	let rootFiles: string[] = await readdir(RENAMING_ROOT_DIRECTORY).filter((x: string) => x.endsWith(FILE_EXTENSION))
	rootFiles		
		.forEach(file => {
			allTypes.forEach(type => {
				RenameTextInFile(file, type, IS_PREFIX ? APPENDAGE+type : type+APPENDAGE)
			});
		});
​
	if (SHOULD_REPLACE_FILENAMES) {
		// Rename all filenames
		files.forEach(filePath => {
			let fullDirectory = path.dirname(filePath)
			let fileName = path.basename(filePath)
			let fileNameSplit = fileName.split(".")
			let fileNameRelevant = fileNameSplit.slice(0,-1)

			let replacement = IS_PREFIX ? APPENDAGE + fileNameRelevant : fileNameRelevant + APPENDAGE
			let remainingPartsOfFileName = fileNameSplit.slice(1)
			let newFileName = replacement + "." + remainingPartsOfFileName
			let newFilePath = path.join(fullDirectory, newFileName)
			renameSync(filePath, newFilePath)
​
			console.log(`Renamed ${filePath} to ${newFilePath}`)
		})
	}
​
	console.log("Done!")
}
​
function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    var _union = new Set(setA);
	setB.forEach(x => _union.add(x));

    return _union;
}
​
function findAll(regexPattern, sourceString, filePath) {
    let output = []
    let match
    // make sure the pattern has the global flag
	let regexPatternWithGlobal = RegExp(regexPattern,"gm")

	console.log(`Parsing ${filePath}`)
    while (match = regexPatternWithGlobal.exec(sourceString)) {
        // get rid of the string copy
		delete match.input

		console.log(`\tFound ${match[1]} from: "${match[0]}"`)

        // store the match data
        output.push(match[1])
    }
    return output
}
​
function FindTypes(filePath: string): Set<string> {
	let text: string = readFileSync(filePath, 'utf8')
​
	// var classRegex = /[A-Z]/g;
	let keywords = LANGUAGE_KEYWORDS
​
	let matches = keywords
		.map(x => {
			let regexString = `^[a-zA-Z\\s]*?${x}\\s([a-zA-Z]+)[:|\\s\{]`
			let regex = new RegExp(regexString, "g");
			return new Set<string>(
					findAll(regex, text, filePath)
					.filter((x: string) => IS_PREFIX ? !x.startsWith(APPENDAGE) : !x.endsWith(APPENDAGE))
					.filter((x: string) => x != "func") // TODO: Replace with something more generic
				)
		})
		.reduce((prev: Set<string>, current: Set<string>) => union(prev, current), new Set<string>())
​
	let matchesSet = new Set<string>(matches)
​
	return matchesSet ? matchesSet : new Set<string>()
}
​
function RenameTextInFile(filePath: string, textToReplace, replacement) {
	let text: string = readFileSync(filePath, 'utf8')
​
	const regex = new RegExp(`\\b${textToReplace}\\b`, 'g');
​
	writeFileSync(filePath, text.replace(regex, replacement))
}
​
run()
