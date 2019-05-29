import { readFileSync, writeFileSync, fstat, rename, renameSync } from "fs";

const readdir = require("recursive-readdir");
const rootDirectory = "/Users/ivan_cheung/code/apps/ios/lib/AirbnbIdentity/AirbnbIdentity/ChinaIdentityVerification/"
const path = require('path')
const shouldReplaceFilenames = false

async function run() {
	let files: string[] = await readdir(rootDirectory)

	// Find all classes, structs, enums and protocols
	let allTypesSet = files
						.filter((x: string) => x.endsWith(".swift"))
						.map((x: string) => FindTypes(x))						
						.reduce((prev: Set<string>, current: Set<string>) => union(prev, current), new Set<string>())
						.values()						
						
	let allTypes: string[] = Array.from(allTypesSet)

	console.log(`Found ${allTypes.length} types:`)
	console.log(allTypes.map(x => `\t${x}`).join("\n"))

	// Rename all text in files
	files.forEach(file => {
		allTypes.forEach(type => {
			RenameTextInFile(file, type, type+"Legacy")
		});
	});

	if (shouldReplaceFilenames) {
		// Rename all filenames
		files.forEach(filePath => {
			let fullDirectory = path.dirname(filePath)
			let fileName = path.basename(filePath)
			let fileNameSplit = fileName.split(".")
			
			let replacement = `${fileName}Legacy`
			let remainingPartsOfFileName = fileNameSplit.slice(1)
			let newFileName = replacement + "." + remainingPartsOfFileName
			let newFilePath = path.join(fullDirectory, newFileName)
			renameSync(filePath, newFilePath)

			console.log(`Renamed ${filePath} to ${newFilePath}!`)
		})
	}

	console.log("Done!")
}

function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    var _union = new Set(setA);
	setB.forEach(x => _union.add(x));
	
    return _union;
}

function findAll(regexPattern, sourceString) {
    let output = []
    let match
    // make sure the pattern has the global flag
    let regexPatternWithGlobal = RegExp(regexPattern,"g")
    while (match = regexPatternWithGlobal.exec(sourceString)) {
        // get rid of the string copy
        delete match.input
        // store the match data
        output.push(match[1])
    } 
    return output
}

function FindTypes(file: string): Set<string> {
	let text: string = readFileSync(file, 'utf8')

	// var classRegex = /[A-Z]/g;
	let keywords = ["class", "enum", "struct", "protocol"]

	let matches = keywords
		.map(x => {
			let regexString = `${x}\\s([a-zA-Z]+)[:|\\s\{]`
			let regex = new RegExp(regexString, "g");
			return new Set<string>(
					findAll(regex, text)
					.filter((x: string) => !x.endsWith("Legacy"))
					.filter((x: string) => x != "func")
				)
		})
		.reduce((prev: Set<string>, current: Set<string>) => union(prev, current), new Set<string>())

	let matchesSet = new Set<string>(matches)

	return matchesSet ? matchesSet : new Set<string>()
}

function RenameTextInFile(filePath: string, textToReplace, replacement) {
	let text: string = readFileSync(filePath, 'utf8')

	const regex = new RegExp(textToReplace, 'g');

	writeFileSync(filePath, text.replace(regex, replacement))
}

run()