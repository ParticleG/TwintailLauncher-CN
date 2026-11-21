import { POPUPS } from "../POPUPS.ts";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// add_repository expects https://<host>/<owner>/<name>; "owner/name" is shorthand for a GitHub repository.
function toRepositoryUrl(input: string): string | null {
    const value = input.trim().replace(/\/+$/, "");
    if (/^[\w.-]+\/[\w.-]+$/.test(value)) return `https://github.com/${value}.git`;
    return /^https:\/\/[^/\s]+\/[\w.-]+\/[\w.-]+$/.test(value) ? value : null;
}

export default function AddRepo({ setOpenPopup, fetchRepositories }: { setOpenPopup: (popup: POPUPS) => void, fetchRepositories: () => void }) {
    const [isClosing, setIsClosing] = useState(false);
    const [repository, setRepository] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState("");

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setOpenPopup(POPUPS.NONE);
        }, 220);
    };

    const addRepository = () => {
        const url = toRepositoryUrl(repository);
        if (url === null) {
            setError("Enter a repository as owner/name or https://host/owner/name.");
            return;
        }
        setIsAdding(true);
        setError("");
        invoke<boolean | null>("add_repository", { url }).then(added => {
            if (added) {
                fetchRepositories();
                setOpenPopup(POPUPS.REPOMANAGER);
            } else {
                setError("The repository could not be added. Check that it exists, contains a repository.json, and is not added already.");
            }
        }).catch(e => {
            setError(`The repository could not be added: ${e}`);
        }).finally(() => {
            setIsAdding(false);
        });
    };

    return (
        <div className={`rounded-2xl w-[90vw] max-w-2xl max-h-[85vh] bg-[#0c0c0c] border border-white/10 flex flex-col p-6 overflow-hidden shadow-2xl ${isClosing ? 'animate-zoom-out' : 'animate-zoom-in'}`}>
            <div className="flex flex-row items-center gap-4">
                <ArrowLeft className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-3 w-12 h-12 transition-all duration-200 cursor-pointer" onClick={() => {
                    setOpenPopup(POPUPS.REPOMANAGER);
                }} />
                <h1 className="text-white font-bold text-3xl bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">Add a Repository</h1>
                <div className="flex-grow" />
                <X className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-3 w-12 h-12 transition-all duration-200 cursor-pointer" onClick={handleClose} />
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden hover-scrollbar">
                <div className="space-y-2 mt-6">
                    <input type="text"
                        value={repository}
                        disabled={isAdding}
                        onChange={(e) => setRepository(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !isAdding) addRepository(); }}
                        className="w-full focus:outline-none h-12 rounded-xl bg-zinc-800/60 border border-white/30 focus:border-green-400/50 text-white px-4 placeholder-white/50 text-lg transition-all duration-200"
                        placeholder="GitHub repository (i.e. TwintailTeam/KeqingRepo)" />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
            </div>
            <div className="flex justify-center pt-5 mt-4 border-t border-white/10">
                <button disabled={isAdding} className="flex flex-row gap-3 items-center py-3 px-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 rounded-xl transition-all duration-200 transform hover:scale-105 font-semibold text-white" onClick={addRepository}>
                    <span>{isAdding ? "Adding Repository..." : "Add Repository"}</span>
                </button>
            </div>
        </div>
    )
}
