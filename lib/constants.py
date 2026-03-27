"""Shared constants: agent/weapon UUID maps, team registry, map pool."""

OPERATOR_UUID = 'A03B24D3-4319-996D-0F8C-94BBFBA1DFC7'
MAP_ORDER = ['Abyss', 'Bind', 'Breeze', 'Corrode', 'Haven', 'Pearl', 'Split']

AGENT_MAP = {
    '0e38b510-41a8-5780-5e8f-568b2a4f2d6c': 'Iso',
    '117ed9e3-49f3-6512-3ccf-0cada7e3823b': 'Cypher',
    '1dbf2edd-4729-0984-3115-daa5eed44993': 'Clove',
    '1e58de9c-4950-5125-93e9-a0aee9f98746': 'Killjoy',
    '22697a3d-45bf-8dd7-4fec-84a9e28c69d7': 'Chamber',
    '320b2a48-4d9b-a075-30f1-1f93a9b638fa': 'Sova',
    '41fb69c1-4189-7b37-f117-bcaf1e96f1bf': 'Astra',
    '569fdd95-4d10-43ab-ca70-79becc718b46': 'Sage',
    '5f8d3a7f-467b-97f3-062c-13acf203c006': 'Breach',
    '601dbbe7-43ce-be57-2a40-4abd24953621': 'KAY/O',
    '6f2a04ca-43e0-be17-7f36-b3908627744d': 'Skye',
    '707eab51-4836-f488-046a-cda6bf494859': 'Viper',
    '7f94d92c-4234-0a36-9646-3a87eb8b5c89': 'Yoru',
    '8e253930-4c05-31dd-1b6c-968525494517': 'Omen',
    '92eeef5d-43b5-1d4a-8d03-b3927a09034b': 'Veto',
    '95b78ed7-4637-86d9-7e41-71ba8c293152': 'Harbor',
    '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': 'Brimstone',
    'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc': 'Reyna',
    'add6443a-41bd-e414-f6ad-e58d267f4e95': 'Jett',
    'b444168c-4e35-8076-db47-ef9bf368f384': 'Tejo',
    'bb2a4828-46eb-8cd1-e765-15848195d751': 'Neon',
    'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235': 'Deadlock',
    'dade69b4-4f5a-8528-247b-219e5a1facd6': 'Fade',
    'df1cb487-4902-002e-5c17-d28e83e78588': 'Waylay',
    'e370fa57-4757-3604-3648-499e1f642d3f': 'Gekko',
    'eb93336a-449b-9c1b-0a54-a891f7921d69': 'Phoenix',
    'efba5359-4016-a1e5-7626-b1ae76895940': 'Vyse',
    'f94c3b30-42be-e959-889c-5aa313dba261': 'Raze',
}

AGENT_ROLE = {
    'Iso': 'Duelist', 'Jett': 'Duelist', 'Neon': 'Duelist', 'Phoenix': 'Duelist',
    'Raze': 'Duelist', 'Reyna': 'Duelist', 'Waylay': 'Duelist', 'Yoru': 'Duelist',
    'Breach': 'Initiator', 'Fade': 'Initiator', 'Gekko': 'Initiator', 'KAY/O': 'Initiator',
    'Skye': 'Initiator', 'Sova': 'Initiator', 'Tejo': 'Initiator',
    'Astra': 'Controller', 'Brimstone': 'Controller', 'Clove': 'Controller', 'Harbor': 'Controller',
    'Omen': 'Controller', 'Miks': 'Controller', 'Viper': 'Controller',
    'Chamber': 'Sentinel', 'Cypher': 'Sentinel', 'Deadlock': 'Sentinel', 'Killjoy': 'Sentinel',
    'Sage': 'Sentinel', 'Vyse': 'Sentinel', 'Veto': 'Sentinel',
}

WEAPON_MAP = {
    '29A0CFAB-485B-F5D5-779A-B59F85E204A8': 'Classic',
    '42DA8CCC-40D5-AFFC-BEEC-15AA47B42EDA': 'Shorty',
    '44D4E95C-4157-0037-81B2-17841BF2E8E3': 'Frenzy',
    '1BAA85B4-4C70-1284-64BB-6481DFC3BB4E': 'Ghost',
    'E336C6B8-418D-9340-D77F-7A9E4CFE0702': 'Sheriff',
    'F7E1B454-4AD4-1063-EC0A-159E56B58941': 'Stinger',
    '462080D1-4035-2937-7C09-27AA2A5C27A7': 'Spectre',
    '910BE174-449B-C412-AB22-D0873436B21B': 'Bucky',
    'EC845BF4-4F79-DDDA-A3DA-0DB3774B2794': 'Judge',
    'AE3DE142-4D85-2547-DD26-4E90BED35CF7': 'Bulldog',
    '4ADE7FAA-4CF1-8376-95EF-39884480959B': 'Guardian',
    'EE8E8D15-496B-07AC-E5F6-8FAE5D4C7B1A': 'Phantom',
    '9C82E19D-4575-0200-1A81-3EACF00CF872': 'Vandal',
    'C4883E50-4494-202C-3EC3-6B8A9284F00B': 'Marshal',
    'A03B24D3-4319-996D-0F8C-94BBFBA1DFC7': 'Operator',
    '55D8A0F4-4274-CA67-FE2C-06AB45AC8543': 'Ares',
    '63E6C2B6-4A8E-869C-3D4C-E38355226584': 'Odin',
    '2F59173C-4BED-B6C3-2191-DEE9B58166A2': 'Melee',
}

TEAMS = [
    {'tag': 'FKS',  'name': 'FOKUS',                'data_file': 'data/raw/fks_2026_raw_responses.jsonl'},
    {'tag': 'SGE',  'name': 'Eintracht Frankfurt',  'data_file': 'data/raw/sge_2026_raw_responses.jsonl'},
    {'tag': 'JL',   'name': 'Joblife',              'data_file': 'data/raw/jl_2026_raw_responses.jsonl'},
    {'tag': 'MDR',  'name': 'Mandatory',             'data_file': 'data/raw/mdr_2026_raw_responses.jsonl'},
    {'tag': 'EP',   'name': 'Enterprise Esports',    'data_file': 'data/raw/ep_2026_raw_responses.jsonl'},
    {'tag': 'TL',   'name': 'Team Liquid Academy',   'data_file': 'data/raw/tl_2026_raw_responses.jsonl'},
    {'tag': 'PXL',  'name': 'Pixel Lumina',          'data_file': 'data/raw/pxl_2026_raw_responses.jsonl'},
    {'tag': 'M1R',  'name': 'MIR',                   'data_file': 'data/raw/m1r_2026_raw_responses.jsonl'},
    {'tag': 'BAR',  'name': 'Barça eSports',         'data_file': 'data/raw/bar_2026_raw_responses.jsonl'},
    {'tag': 'UCAM', 'name': 'UCAM Esports',          'data_file': 'data/raw/ucam_2026_raw_responses.jsonl'},
    {'tag': 'MISA', 'name': 'Misa Esports',          'data_file': 'data/raw/misa_2026_raw_responses.jsonl'},
    {'tag': 'S2G',  'name': 'S2G Esports',           'data_file': 'data/raw/s2g_2026_raw_responses.jsonl'},
    {'tag': 'STS',  'name': 'Stallions Esports',     'data_file': 'data/raw/sts_2026_raw_responses.jsonl'},
    {'tag': 'GNG',  'name': 'GnG Amazigh',           'data_file': 'data/raw/gng_2026_raw_responses.jsonl'},
]

PLAYOFF_TAGS = {'EP', 'MDR', 'MISA', 'UCAM'}

PLAYOFF_TEAMS = [t for t in TEAMS if t['tag'] in PLAYOFF_TAGS]

PLAYOFF_MATCH_IDS = {
    # MISA (4 maps, Mar 19-20)
    '5cadffcf-1f28-4e7e-9eaf-ed57375868b4',
    'ea6e413d-f95f-404d-a8f6-7da51c5befdf',
    '1c4f285c-f4e1-411a-94ae-48bdd9a50167',
    '0cafb898-666e-4980-a856-61772ca83ff4',
    # EP (5 maps, Mar 19-20)
    '22607544-de81-49bc-8f37-85c70f596d0b',
    '25d172f7-f241-41ad-bddd-dde81c56e5a1',
    '995243f6-943b-4ea3-98f0-2be7a292c796',
    '5e8c7871-73b1-4f22-ac3a-779f6682cd63',
    'a23565be-b405-40d6-8c9d-bdc7592ccbaf',
    # UCAM (4 maps, Mar 19-22)
    '8cb578c4-a675-45c7-8405-155b2b80da28',
    '9abce8ee-7847-4f91-abc3-17d68e077229',
    'c8d0a2ff-529e-4c34-ab6f-02535841d196',
    '1ac7f08d-1f04-4c5c-98ad-c1f5f3ec75d9',
    # MDR (6 maps, Mar 19-22)
    '45021724-cf69-4b1c-be00-e033ada8f9f4',
    '552d7ee1-e6b1-47fc-99b1-d421663f1253',
    'fe848444-9df2-4991-97d6-f88c2b06646d',
    '225163c0-ece4-4477-a611-327fb837230e',
    '47977248-3e6c-4721-a2a8-60fca030c393',
    '65177388-7b7f-4740-ad96-1d38a0309ac4',
    # EP vs MISA (3 maps, Mar 26)
    '5d62d424-a04c-49c0-8620-9aff76e2f156',
    '318a8b6e-36d6-4ba2-8024-bf8675973a65',
    '7bcd576f-0fe8-4777-af6b-c781cf832861',
    # MDR vs UCAM (3 maps, Mar 26)
    'd0e27b16-a4af-4c34-8807-b931bd92927d',
    '96b68747-35a5-4093-b080-ff799df47e4c',
    'd9e9f061-ea4f-4fd6-b7ad-9add979afbfd',
}

VCL_TAGS = {t['tag'] for t in TEAMS}
TAG_TO_NAME = {t['tag']: t['name'] for t in TEAMS}

# Ability slot names per agent (C=grenade, Q=ability1, E=ability2, X=ultimate)
# Only agents we track for Agent Stats page
ABILITY_NAMES = {
    'Sova': {
        'grenade': 'Owl Drone',
        'ability1': 'Shock Bolt',
        'ability2': 'Recon Bolt',
        'ultimate': "Hunter's Fury",
    },
    'Raze': {
        'grenade': 'Boom Bot',
        'ability1': 'Blast Pack',
        'ability2': 'Paint Shells',
        'ultimate': 'Showstopper',
    },
    'Omen': {
        'grenade': 'Shrouded Step',
        'ability1': 'Paranoia',
        'ability2': 'Dark Cover',
        'ultimate': 'From the Shadows',
    },
}

# Which ability slots can get kills (damageItem values → slot name)
ABILITY_KILL_SLOTS = {
    'GrenadeAbility': 'grenade',
    'Ability1': 'ability1',
    'Ability2': 'ability2',
    'Ultimate': 'ultimate',
}
