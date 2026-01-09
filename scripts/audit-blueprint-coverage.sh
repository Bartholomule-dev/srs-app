#!/bin/bash
# Blueprint Coverage Audit Script
# Generates a baseline audit of exercises and blueprint/skin coverage

echo "=== Blueprint Coverage Audit ==="
echo "Generated: $(date)"
echo ""

echo "Total exercises:"
grep -c "slug:" exercises/python/*.yaml | awk -F: '{sum+=$2} END {print sum}'
echo ""

echo "Exercises with generator:"
grep -c "generator:" exercises/python/*.yaml | awk -F: '{sum+=$2} END {print sum}'
echo ""

echo "Exercises with Mustache templates:"
grep -l "{{" exercises/python/*.yaml | wc -l
echo ""

echo "Exercises per concept:"
for f in exercises/python/*.yaml; do
  name=$(basename $f .yaml)
  count=$(grep -c "slug:" $f)
  echo "  $name: $count"
done
echo ""

echo "Current blueprints:"
ls paths/python/blueprints/
echo ""

echo "Current skins:"
ls paths/python/skins/
echo ""

echo "Exercises in blueprints:"
grep "exercise:" paths/python/blueprints/*.yaml | wc -l
