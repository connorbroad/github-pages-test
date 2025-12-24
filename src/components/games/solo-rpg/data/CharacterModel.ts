import type { Character, ConsumableItem, ConsumableTargetTrait } from "./storage-utils";

export class CharacterModel {
    constructor(public data: Character) {}

    get hp(): number {
        return this.data.currentHitPoints || 0;
    }

    set hp(value: number) {
        this.data.currentHitPoints = Math.min(value, this.data.hitPointMaximum || 999);
    }

    get tempHp(): number {
        return this.data.temporaryHitPoints || 0;
    }

    set tempHp(value: number) {
        this.data.temporaryHitPoints = value;
    }

    get hitPointMaximum(): number {
        return this.data.hitPointMaximum || 0;
    }

    set hitPointMaximum(value: number) {
        this.data.hitPointMaximum = value;
    }

    /**
     * Apply a consumable effect to this character
     * @param target The target trait (HP, Ability, Skill, etc.)
     * @param value The value to apply (add/set)
     * @returns The applied value (for logging)
     */
    applyConsumableEffect(target: ConsumableTargetTrait, value: number): number {
        switch (target.type) {
            case "hp":
                this.hp = this.hp + value;
                return value;
            case "tempHp":
                this.tempHp = this.tempHp + value;
                return value;
            case "hpMax":
                this.hitPointMaximum = this.hitPointMaximum + value;
                return value;
            case "ability": {
                const ability = this.data.abilities?.find(
                    (a) =>
                        a.id === target.abilityId ||
                        a.name.toLowerCase() === target.abilityId.toLowerCase()
                );
                if (ability) {
                    ability.score += value;
                    ability.modifier = Math.floor((ability.score - 10) / 2);
                    return value;
                }
                break;
            }
            case "skill": {
                const skill = this.data.skills?.find(
                    (s) =>
                        s.id === target.skillId ||
                        s.name.toLowerCase() === target.skillId.toLowerCase()
                );
                if (skill) {
                    skill.bonus += value;
                    return value;
                }
                break;
            }
            case "custom":
                // Custom handling would go here, for now just allow it
                console.log(`Applied ${value} to custom value: ${target.customName}`);
                return value;
        }
        return 0;
    }
}
