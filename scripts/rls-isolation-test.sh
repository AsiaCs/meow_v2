#!/usr/bin/env bash
# Live RLS isolation test: create two users, prove A cannot read/update B's rows.
# Uses DoH resolver (local DNS can't resolve the supabase subdomain).
set -uo pipefail
cd "$(dirname "$0")/.."

ANON=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | sed -E 's/.*="?([^"]*)"?/\1/')
HOST=eudyxsewszwytjedzrsv.supabase.co
DOH="--doh-url https://1.1.1.1/dns-query"
R=$RANDOM$RANDOM
PW="Rls-Test-$R-Xy9!"
EA="meow-rls-a-$R@example.com"
EB="meow-rls-b-$R@example.com"

jq_field() { node -e "try{const o=JSON.parse(process.argv[1]);let v=o;for(const k of process.argv[2].split('.'))v=v?.[k];console.log(v??'')}catch(e){console.log('')}" "$1" "$2"; }

signup() {
  curl -s $DOH "https://$HOST/auth/v1/signup" -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$PW\"}"
}

echo "Creating two test users..."
RA=$(signup "$EA"); TA=$(jq_field "$RA" access_token); IA=$(jq_field "$RA" user.id)
RB=$(signup "$EB"); TB=$(jq_field "$RB" access_token); IB=$(jq_field "$RB" user.id)
echo "User A id=$IA token=${TA:+present}"
echo "User B id=$IB token=${TB:+present}"
[ -z "$TA" ] && { echo "SIGNUP A FAILED: $RA"; exit 1; }
[ -z "$TB" ] && { echo "SIGNUP B FAILED: $RB"; exit 1; }

# helper: count rows returned
rows() { node -e "try{const a=JSON.parse(process.argv[1]);console.log(Array.isArray(a)?a.length:'ERR:'+(a.message||JSON.stringify(a).slice(0,60)))}catch(e){console.log('parse')}" "$1"; }

echo ""
echo "=== TEST 1: A reads own users row (expect 1) ==="
r=$(curl -s $DOH "https://$HOST/rest/v1/users?id=eq.$IA&select=id,email" -H "apikey: $ANON" -H "Authorization: Bearer $TA")
echo "  rows=$(rows "$r")   $([ "$(rows "$r")" = "1" ] && echo PASS || echo 'CHECK')"

echo "=== TEST 2: A reads B's users row by guessing id (expect 0 = blocked) ==="
r=$(curl -s $DOH "https://$HOST/rest/v1/users?id=eq.$IB&select=id,email" -H "apikey: $ANON" -H "Authorization: Bearer $TA")
echo "  rows=$(rows "$r")   $([ "$(rows "$r")" = "0" ] && echo '✅ PASS (blocked)' || echo '🔴 FAIL (leak!)')"

echo "=== TEST 3: A UPDATEs B's users row (expect 0 rows affected = blocked) ==="
r=$(curl -s $DOH -X PATCH "https://$HOST/rest/v1/users?id=eq.$IB" -H "apikey: $ANON" -H "Authorization: Bearer $TA" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"name":"HACKED"}')
echo "  rows=$(rows "$r")   $([ "$(rows "$r")" = "0" ] && echo '✅ PASS (blocked)' || echo '🔴 FAIL (write leak!)')"

echo "=== TEST 4: B creates an experience, A tries to read it (expect 0 = blocked) ==="
ce=$(curl -s $DOH "https://$HOST/rest/v1/experiences" -H "apikey: $ANON" -H "Authorization: Bearer $TB" -H "Content-Type: application/json" -H "Prefer: return=representation" -d "{\"userId\":\"$IB\",\"type\":\"WORK\",\"title\":\"Secret Job\",\"organization\":\"B Corp\"}")
eid=$(jq_field "$ce" 0.id)
echo "  B created experience id=${eid:-FAILED} ($(rows "$ce"))"
r=$(curl -s $DOH "https://$HOST/rest/v1/experiences?userId=eq.$IB&select=*" -H "apikey: $ANON" -H "Authorization: Bearer $TA")
echo "  A reads B's experiences: rows=$(rows "$r")   $([ "$(rows "$r")" = "0" ] && echo '✅ PASS (blocked)' || echo '🔴 FAIL (leak!)')"

echo "=== TEST 5: A DELETEs B's experience (expect 0 = blocked) ==="
r=$(curl -s $DOH -X DELETE "https://$HOST/rest/v1/experiences?userId=eq.$IB" -H "apikey: $ANON" -H "Authorization: Bearer $TA" -H "Prefer: return=representation")
echo "  rows deleted=$(rows "$r")   $([ "$(rows "$r")" = "0" ] && echo '✅ PASS (blocked)' || echo '🔴 FAIL (delete leak!)')"

echo ""
echo "Test users created (delete later in Supabase → Auth → Users):"
echo "  $EA"
echo "  $EB"
