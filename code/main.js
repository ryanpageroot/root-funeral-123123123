/* global moment ReactivationOption InvalidRequestError AlteredPolicy AlterationPackage QuotePackage Application Policy generatePolicyNumber Joi RequotePolicy root */
/* eslint-disable @typescript-eslint/no-unused-vars */

function getReactivationOptions(policy) {
  return [
    new ReactivationOption({
      type: 'reinstatement',
      settlementAmount: Math.abs(policy.balance),
      description: 'For a policy to be reinstated, all arrear premiums must first be paid.',
      minimumBalanceRequired: true,
    }),
    new ReactivationOption({
      type: 'recommencement',
      description: 'For a policy to be recommenced, all arrear premiums will be deducted from the first claim income.',
      minimumBalanceRequired: false,
    }),
  ];
}

function applyAlteration({ alteration_hook_key, policy, policyholder, alteration_package }) {
  if (alteration_hook_key === 'hook_1') {
    return new AlteredPolicy({
      package_name: 'Funeral Cover',
      sum_assured: Number(alteration_package.sum_assured) + 11100,
      monthly_premium: Number(alteration_package.monthly_premium) + 11100,
      end_date: moment().add(2, 'year'),
      base_premium: Number(alteration_package.module.base_premium) + 11100,
      start_date: moment(policy.start_date),
      charges: policy.charges,
      module: {
        ...policy.module,
        ...alteration_package.module,
      },
    });
  }
}

function getAlteration({ alteration_hook_key, data, policy, policyholder }) {
  if (alteration_hook_key === 'hook_1') {
    return new AlterationPackage({
      input_data: {},
      sum_assured: Number(policy.sum_assured) + 99900,
      monthly_premium: Number(policy.monthly_premium) + 11100,
      change_description: 'applying alteration hook 1',
      module: {
        suggested_premium: Number(policy.suggested_premium || policy.base_premium) + 11100,
        package_name: 'Funeral Cover',
        base_premium: Number(policy.base_premium) + 11100,
        cover_amount: data.cover_amount,
        age: data.age,
        alteration_package_applied: true,
        billing_frequency: 'monthly',
      },
    });
  }
}

function validateAlterationPackageRequest({ alteration_hook_key, data }) {
  if (alteration_hook_key === 'hook_1') {
    return Joi.validate(
      data,
      Joi.object().keys({
        cover_amount: Joi.number()
          .integer()
          .positive()
          .min(5000 * 100)
          .max(100000 * 100)
          .required(),
        // Main policyholder
        age: Joi.number().integer().positive().min(18).max(70).required(),
        gender: Joi.valid(['male', 'female']).allow(null).optional(),
      }),
    );
  }
}

const dateOfBirthFromID = (id) => {
  let birthDate = moment(id.toString().slice(0, 6), 'YYMMDD');
  if (birthDate.isSameOrAfter(moment())) {
    birthDate = moment(`19${id.toString().slice(0, 6)}`, 'YYYYMMDD');
  }
  return birthDate;
};

const ageFromID = (id) => {
  const birthDate = dateOfBirthFromID(id);
  const age = moment().diff(birthDate, 'years');
  return age;
};

const ageFromDateOfBirth = (dob) => {
  const birthDate = moment(dob, 'YYYYMMDD');
  const age = moment().diff(birthDate, 'years');
  return age;
};

const policyholderAge = (policyholder) => {
  const { id } = policyholder;
  if (id.type === 'id') return ageFromID(id.number);
  if (!policyholder.dateOfBirth && !policyholder.date_of_birth)
    throw new Error('Policyholder does not have date of birth');
  else return ageFromDateOfBirth(policyholder.dateOfBirth || policyholder.date_of_birth);
};

const genderFromID = (id) => {
  const code = Number.parseInt(id.toString().slice(6, 10), 10);
  return code < 5000 ? 'female' : 'male';
};

const policyholderGender = (policyholder) => {
  const { id } = policyholder;

  return id.type === 'id' ? genderFromID(id.number) : policyholder.gender;
};

const csvToObject = (csv) => {
  const allRows = csv
    .split('\n')
    .map((row) => row.split(/\s+/g).map((cell) => (isNaN(Number(cell)) ? cell.toLowerCase() : Number(cell))));
  const headings = allRows[0];
  const rows = allRows.slice(1);
  const data = rows.map((row) =>
    row.reduce((acc, cur, i) => {
      acc[headings[i]] = cur;
      return acc;
    }, {}),
  );
  return data;
};

const pricingData = {
  mainMemberAgeRates: csvToObject(
    `Age Male Female Blended_Gender
18 0.4826122829 0.3594848246 0.4296674759
19 0.5323140628 0.4030982073 0.4767512449
20 0.5842409396 0.4527871897 0.5277158271
21 0.6354867971 0.5086308484 0.5809387392
22 0.6866049709 0.571243824 0.6369996777
23 0.7423216097 0.639235336 0.697994512
24 0.7985594413 0.7103446449 0.7606270789
25 0.8584733535 0.7817138133 0.8254667512
26 0.9223825095 0.8505807206 0.8915077403
27 0.99 0.9144584451 0.9575171314
28 1.060905956 0.9699190779 1.021781598
29 1.133856929 1.018764672 1.084367258
30 1.204559813 1.058289428 1.141663547
31 1.274673132 1.088464615 1.19460347
32 1.339584188 1.110239055 1.240965781
33 1.399428431 1.126361015 1.282009442
34 1.456292951 1.136167136 1.31863885
35 1.507487864 1.142140115 1.350388331
36 1.555308268 1.145773617 1.379208368
37 1.601003312 1.148470741 1.406414307
38 1.645739731 1.151331885 1.433144357
39 1.692823977 1.155102431 1.461603712
40 1.73962877 1.160067693 1.490417507
41 1.788405229 1.166249147 1.520878113
42 1.84001064 1.173613881 1.553460034
43 1.895528898 1.182149808 1.588775889
44 1.956229318 1.191975249 1.627600068
45 2.023287919 1.203428055 1.670748177
46 2.097280151 1.21897379 1.719608416
47 2.181660616 1.237474609 1.775660633
48 2.271578016 1.261763955 1.837357969
49 2.368267897 1.292800482 1.905816909
50 2.470583757 1.330633101 1.980404975
51 2.577348207 1.375232379 2.060438401
52 2.688201078 1.428811997 2.146663773
53 2.807664565 1.491190519 2.241580725
54 2.931818364 1.564272844 2.34377379
55 3.065140267 1.648221569 2.455865227
56 3.20982004 1.74518278 2.580026018
57 3.36767835 1.849408333 2.714822243
58 3.539889075 1.961475178 2.861171099
59 3.727083131 2.0823896 3.019864912
60 3.935990407 2.21806672 3.197283222
61 4.162945628 2.366904807 3.390648075
62 4.415783479 2.5326892 3.606052939
63 4.695961547 2.715708642 3.844452798
64 5.001920746 2.920750173 4.1070174
65 5.332385095 3.141828579 4.390445793
66 5.69615204 3.383694008 4.701795086
67 6.08339268 3.648822469 5.03652749
68 6.503023751 3.945015632 5.40308026
69 6.950689229 4.264090969 5.795451977
70 7.405018867 4.598015397 6.198007375`,
  ),

  spouseAgeRates: csvToObject(
    `Age Male Female Blended_Gender
18  0.48544531   0.35678688   0.41211000
19  0.53541483   0.40025982   0.45837648
20  0.58743847   0.44987128   0.50902517
21  0.63882026   0.50570022   0.56294184
22  0.69000000   0.56833008   0.62064814
23  0.74591523   0.63642020   0.68350306
24  0.80239875   0.70759169   0.74835873
25  0.86248247   0.77912876   0.81497086
26  0.92660359   0.84813908   0.88187882
27  0.99439080   0.91213172   0.94750313
28  1.06575756   0.96749956   1.00975050
29  1.13908492   1.01658873   1.06926209
30  1.21006540   1.05609603   1.12230286
31  1.28084092   1.08625618   1.16992762
32  1.34631542   1.10793766   1.21044010
33  1.40668069   1.12241741   1.24465062
34  1.46460280   1.13329634   1.27575811
35  1.51678453   1.13884273   1.30135771
36  1.56576539   1.14192598   1.32417693
37  1.61281094   1.14394781   1.34555895
38  1.65910298   1.14600699   1.36663826
39  1.70828800   1.14884320   1.38940446
40  1.75725866   1.15272364   1.41267370
41  1.80851119   1.15763919   1.43751415
42  1.86293538   1.16351748   1.46426718
43  1.92164052   1.17029977   1.49337629
44  1.98590705   1.17805561   1.52543173
45  2.05686791   1.18707940   1.56108846
46  2.13494316   1.19817463   1.60098510
47  2.22484466   1.21280756   1.64798351
48  2.32004965   1.23476429   1.70143700
49  2.42247143   1.26159518   1.76077197
50  2.53102120   1.29480183   1.82637616
51  2.64462149   1.33430744   1.89774248
52  2.76302005   1.38102270   1.97528156
53  2.89228526   1.43786967   2.06326837
54  3.02638252   1.50426011   2.15877274
55  3.17076825   1.58119186   2.26470971
56  3.32767961   1.66731147   2.38126977
57  3.49899355   1.76424410   2.51018636
58  3.68596752   1.86602531   2.64860046
59  3.88933254   1.97561034   2.79851089
60  4.11859913   2.09526852   2.96530068
61  4.36592159   2.23145829   3.14927751
62  4.64042443   2.38181546   3.35301732
63  4.94329625   2.54869560   3.57837388
64  5.27272645   2.73118508   3.82404787
65  5.63528389   2.93560232   4.09646539
66  6.02073422   3.15710519   4.38846567
67  6.43484647   3.40166850   4.70593503
68  6.88084482   3.67280596   5.05226267
69  7.35382808   3.97411734   5.42739296
70  7.83377333   4.28634766   5.81174070 `,
  ),

  childrenAgeRates: csvToObject(
    `Age Rate
0 0.6209950491
1 0.2838517197
2 0.2116126819
3 0.1927518161
4 0.1896994187
5 0.1904629379
6 0.1921625475
7 0.1948765489
8 0.1990063631
9 0.2062347305
10 0.2179440305
11 0.2336926882
12 0.253463885
13 0.277951981
14 0.3056573678
15 0.3390528002
16 0.3777524602
17 0.4209781926
18 0.4682238265
19 0.51816115
20 0.5702987379
21 0.6219705108`,
  ),

  childrenRate: 0.7755994882,

  familyRates: csvToObject(
    `Age  Male  Female  Blended_Gender
0 0.8482625621 0.754611402 0.8014369821
1 0.4150360773 0.3692493336 0.3921427055
2 0.3225971665 0.2805793396 0.301588253
3 0.2983585764 0.2591424009 0.2787504887
4 0.2935133865 0.253876543 0.2736949647
5 0.2926774062 0.2511880673 0.2719327367
6 0.2923777571 0.2482809034 0.2703293303
7 0.2931210161 0.2456373761 0.2693791961
8 0.2951064937 0.243738794 0.2694226438
9 0.3007755386 0.2440898476 0.2724326931
10 0.3125300707 0.2485390329 0.2805345518
11 0.3300616836 0.2573791144 0.293720399
12 0.3534129586 0.2715191729 0.3124660657
13 0.3831684724 0.292066165 0.3376173187
14 0.4192121259 0.3201807795 0.3696964527
15 0.4636175949 0.3585676345 0.4110926147
16 0.5160780385 0.4054852661 0.4607816523
17 0.5763709082 0.4598685372 0.5181197227
18 0.6439621069 0.5219744103 0.5829682586
19 0.7180933637 0.5964930364 0.6572932
20 0.7955785542 0.6806113905 0.7380949724
21 0.8748602108 0.7771261623 0.8259931866
22 0.957742954 0.8835615954 0.9206522747
23 1.046390798 1 1.023195399
24 1.14151362 1.11910963 1.130311625
25 1.243713376 1.240303052 1.242008214
26 1.353296965 1.354589858 1.353943411
27 1.471377564 1.460227873 1.465802719
28 1.593998528 1.552396038 1.573197283
29 1.720140867 1.629400141 1.674770504
30 1.842601905 1.69255452 1.767578212
31 1.958383385 1.738661871 1.848522628
32 2.065211037 1.770169486 1.917690262
33 2.164117189 1.789223965 1.976670577
34 2.250937714 1.798487342 2.024712528
35 2.328047701 1.800525855 2.064286778
36 2.397406639 1.797791467 2.097599053
37 2.461271062 1.792524939 2.126898001
38 2.521798352 1.786445644 2.154121998
39 2.580914777 1.780684346 2.180799561
40 2.640253678 1.775656532 2.207955105
41 2.701171984 1.771359461 2.236265722
42 2.765075251 1.767715567 2.266395409
43 2.837920825 1.764738558 2.301329692
44 2.914348515 1.762723989 2.338536252
45 2.999454598 1.762358056 2.380906327
46 3.094749362 1.765158853 2.429954108
47 3.200766221 1.773361833 2.487064027
48 3.3174525 1.789460117 2.553456309
49 3.444300634 1.815128106 2.62971437
50 3.580204443 1.850969624 2.715587033
51 3.724112642 1.897628334 2.810870488
52 3.876079707 1.957086756 2.916583232
53 4.044447931 2.032071617 3.038259774
54 4.221044556 2.124452991 3.172748774
55 4.413962286 2.239880895 3.32692159
56 4.626723285 2.371945892 3.499334589
57 4.862653617 2.521416776 3.692035197
58 5.124494403 2.687840998 3.9061677
59 5.414567124 2.878509719 4.146538421
60 5.746083457 3.092325339 4.419204398
61 6.112630792 3.336745205 4.724687998
62 6.528001394 3.616626983 5.072314188
63 6.997055158 3.940357669 5.468706414
64 7.521694323 4.30537477 5.913534547
65 8.105023818 4.719589504 6.412306661
66 8.771096774 5.191001787 6.981049281
67 9.505353795 5.738185494 7.621769644
68 10.33125632 6.364400303 8.347828311
69 11.25468934 7.082083757 9.168386549
70 12.26644118 7.892187319 10.07931425
71 13.40383715 8.825995844 11.11491649
72 14.67433731 9.899597985 12.28696765
73 16.13219146 11.15915975 13.6456756
74 17.80942833 12.64886583 15.22914708
75 19.77248261 14.37679022 17.07463642
76 22.04391594 16.3989472 19.22143157
77 24.70473303 18.79823653 21.75148478
78 27.84042064 21.71209215 24.77625639
79 31.60188129 25.18935422 28.39561775
80 36.08343105 29.37096445 32.72719775`,
  ),
};

const legalizeChildCoverAmount = (age, cover) => {
  let legalMax;
  if (age < 6) legalMax = 10000 * 100;
  else if (age < 14) legalMax = 10000 * 100;
  return legalMax < cover ? legalMax : cover;
};

async function getQuote(data) {
  const {
    cover_amount: coverAmount,
    age,
    gender,
    spouse_included: spouseIncluded,
    spouse_cover_amount: spouseCoverAmount,
    spouse,
    children_included: childrenIncluded,
    children_cover_amount: childrenCoverAmount,
    children,
    extended_family_included: extendedFamilyIncluded,
    extended_family_cover_amount: extendedFamilyCoverAmount,
    extended_family: extendedFamily,
  } = data;

  // Build up the premiums
  let riskPremium = 0;
  // Premium: Main policyholder
  const memberAgeRate = pricingData.mainMemberAgeRates.find((ageRate) => ageRate.age === age);
  const memberRate = memberAgeRate[gender || 'blended_gender'];
  riskPremium += (memberRate * coverAmount) / 1000;
  // Premium: Spouse
  if (spouseIncluded) {
    const mainHasGender = !!gender;
    const spouseHasGender = !!spouse.gender;

    if (mainHasGender && !spouseHasGender) {
      throw new InvalidRequestError('Spouse gender required when main member gender is specified');
    } else if (!mainHasGender && spouseHasGender) {
      throw new InvalidRequestError('Spouse gender required when main member gender is specified');
    }

    const spouseAgeRate = pricingData.spouseAgeRates.find((ageRate) => ageRate.age === spouse.age);
    const spouseRate = spouseAgeRate[spouse.gender || 'blended_gender'];
    riskPremium += (spouseRate * spouseCoverAmount) / 1000;
  }
  // Premium: Children
  if (childrenIncluded) {
    if (children) {
      const childrenPremium = children.reduce((sum, child) => {
        const childAgeRate = pricingData.childrenAgeRates.find((ageRate) => ageRate.age === child.age);
        // assuming childAgeRate !== undefined because Joi should confirm within range
        const legalCoverAmount = legalizeChildCoverAmount(child.age, childrenCoverAmount);
        const premium = (childAgeRate.rate * legalCoverAmount) / 1000;
        return sum + premium;
      }, 0);
      riskPremium += childrenPremium;
    } else {
      riskPremium += (pricingData.childrenRate * childrenCoverAmount) / 1000;
    }
  }
  // Premium: extended family members
  if (extendedFamilyIncluded) {
    const extendedFamilyPremium = extendedFamily.reduce((sum, member) => {
      const familyMemberAgeRate = pricingData.familyRates.find((ageRate) => ageRate.age === member.age);
      const familyMemberRate = familyMemberAgeRate[member.gender || 'blended_gender'];
      const premium = (familyMemberRate * extendedFamilyCoverAmount) / 1000;
      return sum + premium;
    }, 0);
    riskPremium += extendedFamilyPremium;
  }

  // Build name and terms
  let nameArray = ['Main Member'];
  let name;
  const termsArray = ['No claim for natural death in first 3 months.'];
  // Build name 1) Spouse
  if (spouseIncluded) {
    nameArray.push('Spouse');
  }
  // Build name 2) Children
  if (childrenIncluded) {
    nameArray.push('Children');
    termsArray.push(
      'Cover for children terminates when they reach the age of 21. Legal cover limits apply to children.',
    );
  }
  // Build name 3) Family
  if (nameArray.length === 3) {
    nameArray = ['Family'];
  }
  // Build name 4) Extended family
  if (extendedFamilyIncluded) {
    name = nameArray.join(', ');
    name += ' & Extended Family';
  } else {
    name = nameArray.join(' & ');
  }

  const basePremium = Math.round(riskPremium / 0.9); // Include platform fee of 10%
  const suggestedPremium = Math.round(riskPremium / 0.7); // 10% platform + 20% commission

  console.log('here1');
  console.log('here2');
  console.log('here3');

  console.warn('here1');
  console.warn('here2');
  console.warn('here3');

  return new QuotePackage({
    package_name: `Funeral Cover: ${name}`,
    sum_assured: coverAmount,
    base_premium: basePremium,
    suggested_premium: suggestedPremium,
    input_data: data,
    module: {
      ...data,
      type: 'root_funeral',
      cover_amount: coverAmount,
      age,
      gender,
      spouse_included: spouseIncluded,
      spouse_cover_amount: spouseCoverAmount,
      spouse,
      children_included: childrenIncluded,
      children_cover_amount: childrenCoverAmount,
      children,
      extended_family_included: extendedFamilyIncluded,
      extended_family_cover_amount: extendedFamilyCoverAmount,
      extended_family: extendedFamily,
      timezone: process.env.ORGANIZATION_TIMEZONE,
    },
  });
}

function getApplication(data, policyholder, quotePackage) {
  const quoteModule = quotePackage.module;
  const { spouse, children, extended_family: extendedFamily } = data;

  // // Check children
  // if (quoteModule.children) {
  //   // Check number of children matches
  //   if (!children || children.length !== quoteModule.children.length) {
  //     throw new InvalidRequestError(`Incorrect number of children provided. Expected: ${quoteModule.children.length}`);
  //   }

  //   // Check ages match quote
  //   const childrenAges = children.map((c) => ageFromDateOfBirth(c.date_of_birth));
  //   const requiredAges = quoteModule.children.map((f) => f.age);
  //   if (childrenAges.sort().toString() !== requiredAges.sort().toString()) {
  //     throw new InvalidRequestError(`Child ages do not match quote. Expected ages: ${requiredAges.sort().toString()}`);
  //   }
  // }

  // // Check, when spouse' age is specified, if age matches quote
  // if (quoteModule.spouse_included && quoteModule.spouse && quoteModule.spouse.age) {
  //   const spouseAge = ageFromDateOfBirth(spouse.date_of_birth);
  //   if (quoteModule.spouse.age !== spouseAge) {
  //     throw new InvalidRequestError(
  //       `Spouse age does not match age provided in quote. Expected: ${quoteModule.spouse.age}`,
  //     );
  //   }
  // }

  // // Check extended family members
  // if (quoteModule.extended_family_included) {
  //   // Check number of family members
  //   if (extendedFamily.length !== quoteModule.extended_family.length) {
  //     throw new InvalidRequestError(
  //       `Number of extended family members must match quote. Expected: ${quoteModule.extended_family.length}`,
  //     );
  //   }

  //   // Check ages match quote
  //   const ages = extendedFamily.map((f) => ageFromDateOfBirth(f.date_of_birth));
  //   const requiredAges = quoteModule.extended_family.map((f) => f.age);
  //   if (ages.sort().toString() !== requiredAges.sort().toString()) {
  //     throw new InvalidRequestError(
  //       `Extended family members' ages do not match quote. Expected ages: ${requiredAges.sort().toString()}`,
  //     );
  //   }
  // }

  // // Reject people 18 and younger, 65 and older
  // const age = policyholderAge(policyholder);
  // if (age < 18) {
  //   throw new InvalidRequestError('Policyholder must be older than 18.');
  // } else if (age >= 70) {
  //   throw new InvalidRequestError("Policyholder can't be older than 70.");
  // }
  // // Make sure policyholder age matches quote
  // if (age !== quoteModule.age) {
  //   throw new InvalidRequestError(`Policyholder does not match quoted age. Expected: ${quoteModule.age}`);
  // }

  // // Make sure policyholder matches gender
  // if (quoteModule.gender) {
  //   const gender = policyholderGender(policyholder);

  //   if (!gender) {
  //     throw new InvalidRequestError(
  //       `Policyholder does not have gender set, but quote expects: ${quoteModule.gender}. Consider updating the policyholder's gender, or getting a gender-less (blended) quote instead.`,
  //     );
  //   }

  //   if (gender !== quoteModule.gender) {
  //     throw new InvalidRequestError(
  //       `Policyholder does not match quoted gender. Expected: ${quoteModule.gender}. Consider getting a gender-less (blended) quote instead.`,
  //     );
  //   }
  // }

  return new Application({
    package_name: quotePackage.package_name,
    sum_assured: quotePackage.sum_assured,
    base_premium: quotePackage.base_premium,
    monthly_premium: quotePackage.suggested_premium,
    input_data: data,
    module: {
      cover_amount: quoteModule.cover_amount,
      age: quoteModule.age,
      gender: quoteModule.gender,
      spouse_included: quoteModule.spouse_included,
      spouse_cover_amount: quoteModule.spouse_cover_amount,
      children_included: quoteModule.children_included,
      children_cover_amount: quoteModule.children_cover_amount,
      extended_family_included: quoteModule.extended_family_included,
      extended_family_cover_amount: quoteModule.extended_family_cover_amount,
      spouse,
      children,
      extended_family: extendedFamily,
    },
  });
}

function getPolicy(application, policyholder) {
  return new Policy({
    package_name: application.package_name,
    sum_assured: application.sum_assured,
    base_premium: application.base_premium,
    monthly_premium: application.monthly_premium,
    start_date: moment(),
    end_date: moment().add(1, 'year'),
    module: { ...application.module },
    charges: [
      {
        type: 'fixed',
        name: 'Fixed Fee',
        description: 'Fixed Fee',
        amount: 1000,
      },
      {
        type: 'variable',
        name: 'Variable Fee',
        description: 'Variable Fee',
        amount: 0.1,
      },
      {
        type: 'balance',
        name: 'Balance',
        description: 'Balance',
      },
    ],
  });
}

function requotePolicy(policy, policyholder, application) {
  return new RequotePolicy({
    package_name: application.package_name,
    sum_assured: application.sum_assured,
    base_premium: application.base_premium,
    monthly_premium: application.monthly_premium,
    end_date: moment().add(1, 'year').format('YYYY-MM-DD'),
    module: { ...application.module },
  });
}

function customScheduledFunction() {
  return [
    {
      name: 'update_policy_module_data',
      data: {
        has_scheduled_function_run: true,
      },
    },
  ];
}

async function afterPaymentSuccess({ policy, payment }) {
  const payments = await root.policies.getPolicyPayments(policy.policy_id);
  return [
    {
      name: 'update_policy_module_data',
      data: {
        has_on_payment_success_run: true,
        policy_id: policy.policy_id,
        payment_id: payment.payment_id,
        number_of_payments: payments.length,
      },
    },
    {
      name: 'update_policy',
      data: {
        monthlyPremium: 1000,
        basePremium: 1000,
        billingAmount: 1000,
      },
    },
    {
      name: 'debit_policy',
      amount: 9999,
      description: 'Debit Policy',
      currency: 'MUR',
    },
  ];
}

async function afterClaimBlockUpdated({ policy, claim }) {
  return [
    {
      name: 'update_claim_module_data',
      data: {
        has_claim_block_updated: true,
      },
    },
  ];
}

async function afterPolicyLinkedToClaim({ policy, claim }) {
  return [
    {
      name: 'update_claim_module_data',
      data: {
        has_after_policy_linked_to_claim_hook_run: true,
      },
    },
  ];
}

async function afterClaimApproved({ policy, claim }) {
  return [
    {
      name: 'update_claim_module_data',
      data: {
        has_after_claim_approved_hook_run: true,
      },
    },
  ];
}

async function afterPolicyNotTakenUp({ policy }) {
  return [
    {
      name: 'update_policy_module_data',
      data: {
        policy_has_not_taken_up: true,
      },
    },
    {
      name: 'update_policy',
      data: {
        monthlyPremium: policy.monthly_premium + 15000,
        basePremium: policy.monthly_premium + 15000,
        billingAmount: policy.monthly_premium + 15000,
      },
    },
  ];
}

async function afterPolicyLapsed({ policy }) {
  return [
    {
      name: 'update_policy_module_data',
      data: {
        policy_has_lapsed: true,
      },
    },
    {
      name: 'update_policy',
      data: {
        monthlyPremium: policy.monthly_premium + 10000,
        basePremium: policy.monthly_premium + 10000,
        billingAmount: policy.monthly_premium + 10000,
        billingDay: 31,
      },
    },
  ];
}

function afterPolicyIssued({ policy }) {
  return [
    {
      name: 'update_policy_module_data',
      data: {
        policy_was_issued: true,
      },
    },
  ];
}

function afterPolicyCancelled({ policy }) {
  return [
    {
      name: 'update_policy_module_data',
      data: {
        policy_was_cancelled: true,
      },
    },
    {
      name: 'update_policy',
      data: {
        monthlyPremium: policy.monthly_premium + 15000,
        basePremium: policy.monthly_premium + 15000,
        billingAmount: policy.monthly_premium + 15000,
      },
    },
  ];
}

async function afterPaymentFailed({ policy, payment }) {
  const payments = await root.policies.getPolicyPayments(policy.policy_id);
  return [
    {
      name: 'update_policy_module_data',
      data: {
        has_on_payment_failed_run: true,
        policy_id: policy.policy_id,
        payment_id: payment.payment_id,
        number_of_payments: payments.length,
      },
    },
    {
      name: 'update_policy',
      data: {
        monthlyPremium: 2000,
        basePremium: 2000,
        billingAmount: 2000,
      },
    },
  ];
}

async function afterPaymentReversed({ policy, payment }) {
  const payments = await root.policies.getPolicyPayments(policy.policy_id);
  return [
    {
      name: 'update_policy_module_data',
      data: {
        has_on_payment_reversed_run: true,
        policy_id: policy.policy_id,
        payment_id: payment.payment_id,
        number_of_payments: payments.length,
      },
    },
    {
      name: 'update_policy',
      data: {
        monthlyPremium: 4000,
        basePremium: 4000,
        billingAmount: 4000,
      },
    },
  ];
}

function afterPolicyReactivated({ policy, reactivationOption }) {
  return reactivationOption.type === 'reinstatement'
    ? [
        {
          name: 'update_policy_module_data',
          data: {
            has_been_reinstated: true,
          },
        },
      ]
    : [
        {
          name: 'update_policy_module_data',
          data: {
            has_been_recommenced: true,
          },
        },
      ];
}

function updatePolicyOnSchedule({ policy }) {
  return [
    {
      name: 'update_policy_module_data',
      data: {
        last_updated: moment().toISOString(),
      },
    },
  ];
}

const extendedFamilyRelationship = Joi.valid([
  'parent',
  'parent_in_law',
  'brother',
  'sister',
  'uncle',
  'aunt',
  'nephew',
  'niece',
  'additional_spouse',
  'additional_child',
]);

const validCountryCodes = [
  'AF',
  'AX',
  'AL',
  'DZ',
  'AS',
  'AD',
  'AO',
  'AI',
  'AQ',
  'AG',
  'AR',
  'AM',
  'AW',
  'AU',
  'AT',
  'AZ',
  'BS',
  'BH',
  'BD',
  'BB',
  'BY',
  'BE',
  'BZ',
  'BJ',
  'BM',
  'BT',
  'BO',
  'BA',
  'BW',
  'BV',
  'BR',
  'VG',
  'IO',
  'BN',
  'BG',
  'BF',
  'BI',
  'KH',
  'CM',
  'CA',
  'CV',
  'KY',
  'CF',
  'TD',
  'CL',
  'CN',
  'HK',
  'MO',
  'CX',
  'CC',
  'CO',
  'KM',
  'CG',
  'CD',
  'CK',
  'CR',
  'CI',
  'HR',
  'CU',
  'CY',
  'CZ',
  'DK',
  'DJ',
  'DM',
  'DO',
  'EC',
  'EG',
  'SV',
  'GQ',
  'ER',
  'EE',
  'ET',
  'FK',
  'FO',
  'FJ',
  'FI',
  'FR',
  'GF',
  'PF',
  'TF',
  'GA',
  'GM',
  'GE',
  'DE',
  'GH',
  'GI',
  'GR',
  'GL',
  'GD',
  'GP',
  'GU',
  'GT',
  'GG',
  'GN',
  'GW',
  'GY',
  'HT',
  'HM',
  'VA',
  'HN',
  'HU',
  'IS',
  'IN',
  'ID',
  'IR',
  'IQ',
  'IE',
  'IM',
  'IL',
  'IT',
  'JM',
  'JP',
  'JE',
  'JO',
  'KZ',
  'KE',
  'KI',
  'KP',
  'KR',
  'KW',
  'KG',
  'LA',
  'LV',
  'LB',
  'LS',
  'LR',
  'LY',
  'LI',
  'LT',
  'LU',
  'MK',
  'MG',
  'MW',
  'MY',
  'MV',
  'ML',
  'MT',
  'MH',
  'MQ',
  'MR',
  'MU',
  'YT',
  'MX',
  'FM',
  'MD',
  'MC',
  'MN',
  'ME',
  'MS',
  'MA',
  'MZ',
  'MM',
  'NA',
  'NR',
  'NP',
  'NL',
  'AN',
  'NC',
  'NZ',
  'NI',
  'NE',
  'NG',
  'NU',
  'NF',
  'MP',
  'NO',
  'OM',
  'PK',
  'PW',
  'PS',
  'PA',
  'PG',
  'PY',
  'PE',
  'PH',
  'PN',
  'PL',
  'PT',
  'PR',
  'QA',
  'RE',
  'RO',
  'RU',
  'RW',
  'BL',
  'SH',
  'KN',
  'LC',
  'MF',
  'PM',
  'VC',
  'WS',
  'SM',
  'ST',
  'SA',
  'SN',
  'RS',
  'SC',
  'SL',
  'SG',
  'SK',
  'SI',
  'SB',
  'SO',
  'ZA',
  'GS',
  'SS',
  'ES',
  'LK',
  'SD',
  'SR',
  'SJ',
  'SZ',
  'SE',
  'CH',
  'SY',
  'TW',
  'TJ',
  'TZ',
  'TH',
  'TL',
  'TG',
  'TK',
  'TO',
  'TT',
  'TN',
  'TR',
  'TM',
  'TC',
  'TV',
  'UG',
  'UA',
  'AE',
  'GB',
  'US',
  'UM',
  'UY',
  'UZ',
  'VU',
  'VE',
  'VN',
  'VI',
  'WF',
  'EH',
  'YE',
  'ZM',
  'ZW',
];

function validateQuoteRequest(data) {
  return Joi.validate(
    data,
    Joi.object()
      .keys({
        start_date: Joi.string().isoDate().required(),
        end_date: Joi.date().iso().required(),
        cover_amount: Joi.number()
          .integer()
          .positive()
          .min(5000 * 100)
          .max(100000 * 100)
          .required(),
        // Main policyholder
        age: Joi.number().integer().positive().min(18).max(70).required(),
        gender: Joi.valid(['male', 'female']).allow(null).optional(),
        admitted_hospital: Joi.valid(['no']).allow(null).optional(),
        declined_cover: Joi.valid(['no']).allow(null).optional(),
        // Spouse
        spouse_included: Joi.boolean().required(),
        spouse_cover_amount: Joi.when('spouse_included', {
          is: true,
          then: Joi.number()
            .integer()
            .positive()
            .min(5000 * 100)
            .max(100000 * 100)
            .required(),
          otherwise: Joi.allow(null).optional().strip(), // if not included, remove from result
        }),
        spouse: Joi.when('spouse_included', {
          is: true,
          then: Joi.object()
            .keys({
              age: Joi.number().integer().positive().min(18).max(70).required(),
              gender: Joi.valid(['male', 'female']).allow(null).optional(),
            })
            .required(),
          otherwise: Joi.allow(null).optional().strip(), // if not included, remove from result
        }),
        // Children
        children_included: Joi.boolean().required(),
        children_cover_amount: Joi.when('children_included', {
          is: true,
          then: Joi.number()
            .integer()
            .positive()
            .min(1000 * 100)
            .max(100000 * 100)
            .required(),
          otherwise: Joi.allow(null).optional().strip(),
        }),
        children: Joi.when('children_included', {
          is: true,
          then: Joi.array().items(
            Joi.object()
              .keys({
                age: Joi.number().integer().min(0).max(21).required(),
              })
              .required(),
          ),
          otherwise: Joi.allow(null).optional().strip(), // if not included, remove from result
        }),
        // Extended family
        extended_family_included: Joi.boolean().required(),
        extended_family_cover_amount: Joi.when('extended_family_included', {
          is: true,
          then: Joi.number()
            .integer()
            .positive()
            .min(5000 * 100)
            .max(100000 * 100)
            .required(),
          otherwise: Joi.allow(null).optional().strip(),
        }),
        extended_family: Joi.when('extended_family_included', {
          is: true,
          then: Joi.array()
            .items(
              Joi.object()
                .keys({
                  age: Joi.number().integer().min(0).max(80).required(),
                  gender: Joi.valid(['male', 'female']).optional(),
                })
                .required(),
            )
            .required(),
          otherwise: Joi.allow(null).optional().strip(), // if not included, remove from result
        }),
      })
      .required(),
  );
}

function validateApplicationRequest(data, policyholder, quotePackage) {
  const quoteModule = quotePackage.module;
  return Joi.validate(
    data,
    Joi.object()
      .keys({
        currency: Joi.string().optional(),
        spouse: quoteModule.spouse_included
          ? Joi.object()
              .keys({
                first_name: Joi.string().required(),
                last_name: Joi.string().required(),
                date_of_birth: Joi.dateOfBirth().required(),
              })
              .required()
          : Joi.allow(null).optional().strip(),
        // Children
        children: quoteModule.children_included
          ? Joi.array()
              .items(
                Joi.object()
                  .keys({
                    first_name: Joi.string().required(),
                    last_name: Joi.string().required(),
                    date_of_birth: Joi.dateOfBirth().required(),
                  })
                  .required(),
              )
              .required()
          : Joi.allow(null).optional().strip(),
        // Extended family
        extended_family: quoteModule.extended_family_included
          ? Joi.array()
              .items(
                Joi.object()
                  .keys({
                    first_name: Joi.string().required(),
                    last_name: Joi.string().required(),
                    date_of_birth: Joi.dateOfBirth().required(),
                    relationship: extendedFamilyRelationship.required(),
                  })
                  .required(),
              )
              .required()
          : Joi.allow(null).optional().strip(),
      })
      .required(),
  );
}

function validateClaimRequest(data) {
  return Joi.validate(
    data,
    Joi.object()
      .keys({
        has_after_policy_linked_to_claim_hook_run: Joi.boolean().optional(),
        has_after_claim_approved_hook_run: Joi.boolean().optional(),
        member_deceased: Joi.valid(['main_member', 'other_insured']).required(),
        incident_type: Joi.valid(['death', 'accidental_death']).required(),
        incident_cause: Joi.string().optional(),
        incident_date: Joi.string().required(),
        date_of_death: Joi.string().isoDate().required(),

        police_station: Joi.string().when('incident_type', {
          is: 'accidental_death',
          then: Joi.required(),
          otherwise: Joi.forbidden().allow(null),
        }),

        police_case_number: Joi.string().when('incident_type', {
          is: 'accidental_death',
          then: Joi.required(),
          otherwise: Joi.forbidden().allow(null),
        }),

        deceased: Joi.object()
          .keys({
            id_type: Joi.valid(['id', 'passport']).required(),
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),

            id_number: Joi.string()
              .idNumber()
              .when('id_type', {
                is: 'id',
                then: Joi.required(),
                otherwise: Joi.forbidden().allow(null),
              }),

            passport_number: Joi.string().when('id_type', {
              is: 'passport',
              then: Joi.required(),
              otherwise: Joi.forbidden().allow(null),
            }),

            id_country: Joi.valid(validCountryCodes).when('id_type', {
              is: 'passport',
              then: Joi.required(),
              otherwise: Joi.forbidden().allow(null),
            }),

            gender: Joi.string().when('id_type', {
              is: 'passport',
              then: Joi.required(),
              otherwise: Joi.forbidden().allow(null),
            }),

            date_of_birth: Joi.string()
              .isoDate()
              .when('id_type', {
                is: 'passport',
                then: Joi.required(),
                otherwise: Joi.forbidden().allow(null),
              }),
          })
          .when('member_deceased', {
            is: 'main_member',
            then: Joi.forbidden().allow(null),
            otherwise: Joi.required(),
          }),
        dha_reference_number: Joi.string().required(),
        doctor: Joi.object()
          .keys({
            name: Joi.string().optional(),
            contact_number: Joi.string().optional(),
            address: Joi.string().optional(),
          })
          .optional(),
      })
      .required(),
  );
}
