import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple


ROOT_DIR = Path(__file__).resolve().parent.parent
MOCK_DATA_PATH = ROOT_DIR / "src" / "data" / "mockData.json"
DEFAULT_REVIEW_PATH = ROOT_DIR / "dist" / "library_update_reviews" / "latest.json"


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)


def find_item_by_id(items: List[Dict[str, Any]], target_id: str) -> Dict[str, Any]:
    for item in items:
        if str(item.get("id")) == target_id:
            return item
        subsections = item.get("subsections") or []
        if subsections:
            match = find_item_by_id(subsections, target_id)
            if match:
                return match
    return {}


def apply_proposal(item: Dict[str, Any], proposal: Dict[str, Any]) -> bool:
    if not item:
        return False

    current_content = str(item.get("content", ""))
    expected_original = str(proposal.get("originalContent", ""))
    proposed_content = str(proposal.get("proposedContent", ""))
    updated_segments = proposal.get("updatedSegments", [])

    if current_content != expected_original:
        raise ValueError(
            f"Library item {proposal.get('libraryId')} has changed since the proposal was generated. "
            "Regenerate the review bundle before applying."
        )

    item["content"] = proposed_content
    item["recentlyUpdated"] = True
    if isinstance(updated_segments, list):
        item["updatedSegments"] = updated_segments
    return True


def select_approved_proposals(
    review_payload: Dict[str, Any], proposal_ids: List[str], approve_all: bool
) -> List[Dict[str, Any]]:
    proposals = review_payload.get("proposals", [])
    if not isinstance(proposals, list):
        return []

    selected: List[Dict[str, Any]] = []
    id_set = set(proposal_ids)
    for proposal in proposals:
        if not isinstance(proposal, dict):
            continue
        status = str(proposal.get("status", "")).lower()
        proposal_id = str(proposal.get("proposalId", ""))

        if approve_all and status in {"approved", "pending"}:
            selected.append(proposal)
            continue

        if proposal_id in id_set or status == "approved":
            selected.append(proposal)

    return selected


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Apply approved staged Library updates to mockData.json"
    )
    parser.add_argument(
        "--review-file",
        default=str(DEFAULT_REVIEW_PATH),
        help="Path to pending_changes.json or latest.json",
    )
    parser.add_argument(
        "--proposal-id",
        action="append",
        default=[],
        help="Specific proposal ID to apply. Can be supplied multiple times.",
    )
    parser.add_argument(
        "--approve-all",
        action="store_true",
        help="Apply every pending or approved proposal in the review file.",
    )
    args = parser.parse_args()

    review_path = Path(args.review_file)
    if not review_path.exists():
        raise FileNotFoundError(f"Review file not found: {review_path}")

    library_payload = load_json(MOCK_DATA_PATH)
    review_payload = load_json(review_path)
    approved_proposals = select_approved_proposals(
        review_payload,
        proposal_ids=args.proposal_id,
        approve_all=args.approve_all,
    )

    if not approved_proposals:
        print("No approved proposals found to apply.")
        return

    applied: List[Tuple[str, str]] = []
    for proposal in approved_proposals:
        library_id = str(proposal.get("libraryId", ""))
        item = find_item_by_id(library_payload, library_id)
        if not item:
            raise ValueError(f"Library ID not found in mockData.json: {library_id}")

        if apply_proposal(item, proposal):
            proposal["status"] = "applied"
            applied.append((proposal.get("proposalId", ""), library_id))

    save_json(MOCK_DATA_PATH, library_payload)
    save_json(review_path, review_payload)

    print(f"Applied {len(applied)} proposal(s) to {MOCK_DATA_PATH}")
    for proposal_id, library_id in applied:
        print(f"- {proposal_id} -> Library ID {library_id}")


if __name__ == "__main__":
    main()
